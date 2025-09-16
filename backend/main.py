"""
Enhanced AI-based Personalized Itinerary Planner
Flask API version for website integration - V5 (Multi-City with Personalization)

Required packages:
pip install flask geopy ortools pandas numpy
"""

import os
import math
import datetime
import json
import logging
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Tuple, Any
from collections import defaultdict
import numpy as np
import pandas as pd
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
from geopy.distance import geodesic
from functools import lru_cache
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# --------------------
# Configuration
# --------------------
class Config:
    MAX_POIS_PER_DAY = 6
    MIN_POIS_PER_DAY = 2
    DEFAULT_BUDGET = 50000
    DEFAULT_BASE_LOCATION = (23.36, 85.33)  # Default to Ranchi coordinates

    TRANSPORT_PROFILES = {
        "car": {"speed": 50.0, "cost_km": 8.0, "comfort": 0.9, "flexibility": 1.0},
        "bus": {"speed": 35.0, "cost_km": 3.0, "comfort": 0.6, "flexibility": 0.7},
        "train": {"speed": 70.0, "cost_km": 2.0, "comfort": 0.8, "flexibility": 0.5},
        "bike": {"speed": 25.0, "cost_km": 2.0, "comfort": 0.4, "flexibility": 0.9},
        "auto": {"speed": 30.0, "cost_km": 12.0, "comfort": 0.5, "flexibility": 0.8}
    }

    PACE_CONFIGS = {
        "relaxed": {"daily_hours": 6, "max_travel_hours": 2, "rest_buffer": 60, "pois_per_day": 2},
        "moderate": {"daily_hours": 8, "max_travel_hours": 3, "rest_buffer": 45, "pois_per_day": 3},
        "fast": {"daily_hours": 10, "max_travel_hours": 4, "rest_buffer": 30, "pois_per_day": 4}
    }

config = Config()

# --------------------
# Data Models
# --------------------
@dataclass
class POI:
    id: str
    name: str
    city: str
    lat: float
    lon: float
    categories: List[str]
    duration: int
    popularity: float
    open_time: int
    close_time: int
    cost: float
    nearest_station_id: Optional[str] = None
    description: str = ""
    rating: float = 0.0
    review_count: int = 0
    accessibility_score: float = 0.5
    family_friendly: bool = True
    best_time_to_visit: List[str] = None

    def __post_init__(self):
        if self.best_time_to_visit is None:
            self.best_time_to_visit = []

@dataclass
class TrainStation:
    id: str
    name: str
    city: str
    lat: float
    lon: float

@dataclass
class ItineraryDay:
    day_number: int
    date: str
    pois: List[Dict]
    total_cost: float
    total_travel_time: int
    total_visit_time: int
    overnight_location: str

@dataclass
class TripPlan:
    days: List[ItineraryDay]
    total_cost: float
    total_pois: int
    user_preferences: Dict
    generated_at: str

# --------------------
# Utility Functions
# --------------------
@lru_cache(maxsize=1000)
def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    if abs(lat1 - lat2) < 1e-9 and abs(lon1 - lon2) < 1e-9:
        return 0.0
    return geodesic((lat1, lon1), (lat2, lon2)).kilometers

def time_to_minutes(time_str: str) -> int:
    if not time_str or time_str == "--:--":
        return 0
    try:
        h, m = map(int, time_str.split(':'))
        return h * 60 + m
    except:
        return 0
 
def minutes_to_time(total_minutes: int) -> str:
    days = total_minutes // (24 * 60)
    mins_in_day = total_minutes % (24 * 60)
    hours = mins_in_day // 60
    mins = mins_in_day % 60
    if days == 0:
        return f"{hours:02d}:{mins:02d}"
    elif days == 1:
        return f"+1 day {hours:02d}:{mins:02d}"
    else:
        return f"+{days} days {hours:02d}:{mins:02d}"

def calculate_road_travel(lat1, lon1, lat2, lon2, mode="car"):
    profile = config.TRANSPORT_PROFILES.get(mode, config.TRANSPORT_PROFILES["car"])
    distance = calculate_distance(lat1, lon1, lat2, lon2)
    if distance > 200:
        effective_speed = 80.0  # highway speed for long distances
        traffic_factor = 1.0
    else:
        effective_speed = profile["speed"]
        traffic_factor = 1.0
        if distance > 50:
            traffic_factor = 1.3
        elif distance > 20:
            traffic_factor = 1.2
        else:
            traffic_factor = 1.1
    time = (distance / effective_speed) * 60
    cost = distance * profile["cost_km"]
    return {"time": int(time * traffic_factor), "cost": cost, "distance": distance}

# --------------------
# Data Storage
# --------------------
class POIStorage:
    def __init__(self):
        self.pois_dict: Dict[str, POI] = {}
        self._initialize_default_pois()

    def _initialize_default_pois(self):
        default_pois = [
            # Ranchi Area
            POI("hundru_falls", "Hundru Falls", "Ranchi", 23.5100, 85.4200, ["nature", "waterfall", "adventure"], 120, 0.75, 360, 1080, 200, "RNC", "98m high waterfall, spectacular during monsoons", 4.0, 2100, 0.6, True, ["Jul", "Aug", "Sep", "Oct"]),
            POI("jonha_falls", "Jonha Falls", "Ranchi", 23.3600, 85.2500, ["nature", "waterfall"], 100, 0.7, 420, 1020, 150, "RNC", "Beautiful waterfall with natural pool", 3.8, 1500, 0.7, True, ["Jul", "Aug", "Sep", "Oct"]),
            POI("dassam_falls", "Dassam Falls", "Ranchi", 23.14, 85.46, ["nature", "waterfall"], 90, 0.7, 540, 1020, 50, "RNC", rating=4.2, family_friendly=True),
            POI("patratu_valley", "Patratu Valley", "Ranchi", 23.6300, 85.2700, ["nature", "scenic_drive", "lake"], 90, 0.65, 360, 1140, 100, "PTRU", "Scenic valley with beautiful lake views", 3.9, 950, 0.8, True),
            POI("jagannath_temple_ranchi", "Jagannath Temple", "Ranchi", 23.32, 85.27, ["culture", "temple", "history"], 60, 0.85, 360, 1200, 0, "RNC", rating=4.6, family_friendly=True),
            # Deoghar Area
            POI("deoghar_temple", "Baidyanath Temple", "Deoghar", 24.4800, 86.7000, ["culture", "temple", "pilgrimage"], 150, 0.9, 240, 1320, 50, "JSME", "One of 12 Jyotirlingas, major pilgrimage site", 4.5, 5000, 0.5, True),
            POI("trikut_pahar", "Trikut Pahar", "Deoghar", 24.38, 86.85, ["adventure", "nature", "viewpoint"], 180, 0.7, 480, 1020, 150, "JSME", rating=4.3, family_friendly=False),
            # Jamshedpur Area
            POI("jubilee_park", "Jubilee Park", "Jamshedpur", 22.80, 86.19, ["park", "leisure", "garden"], 120, 0.8, 360, 1260, 0, "TATA", rating=4.5, family_friendly=True),
            POI("dalma_sanctuary", "Dalma Wildlife Sanctuary", "Jamshedpur", 22.92, 86.22, ["nature", "wildlife", "adventure"], 240, 0.7, 420, 1020, 500, "TATA", rating=4.1, family_friendly=False),
            # Palamu/Betla Area
            POI("betla_np", "Betla National Park", "Betla", 23.8500, 84.2100, ["nature", "wildlife", "adventure", "national_park"], 240, 0.9, 360, 1050, 1500, "DTO", "Famous tiger reserve with diverse wildlife", 4.3, 1250, 0.7, True, ["Oct", "Nov", "Dec", "Jan", "Feb"]),
            POI("palamu_fort", "Palamu Fort", "Betla", 24.1200, 83.5200, ["history", "fort", "architecture"], 150, 0.6, 540, 1020, 200, "DTO", "Historic fort with Mughal architecture", 3.7, 400, 0.5, True, ["Oct", "Nov", "Dec", "Jan", "Feb"]),
            # Netarhat Area
            POI("netarhat", "Netarhat Hills", "Netarhat", 23.4800, 84.2700, ["nature", "viewpoint", "hill_station"], 180, 0.85, 330, 1140, 800, "LAD", "Queen of Chotanagpur with stunning sunrise views", 4.1, 890, 0.8, True, ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]),
            POI("magnolia_point", "Magnolia Sunset Point", "Netarhat", 23.49, 84.25, ["nature", "viewpoint", "hill_station"], 90, 0.85, 960, 1140, 0, "LAD", rating=4.6, family_friendly=True),
            # Giridih/Parasnath Area
            POI("parasnath_hills", "Parasnath Hills", "Parasnath", 23.97, 86.11, ["pilgrimage", "nature", "trekking", "temple"], 480, 0.9, 300, 1080, 0, "PNME", rating=4.8, family_friendly=False),
            # Hazaribagh Area
            POI("hazaribagh_np", "Hazaribagh National Park", "Hazaribagh", 23.9800, 85.3600, ["nature", "wildlife"], 180, 0.75, 360, 1020, 1200, "BKSC", "Wildlife sanctuary with tigers and leopards", 4.0, 600, 0.6, True, ["Nov", "Dec", "Jan", "Feb", "Mar"]),
            # Other Areas
            POI("rajrappa_temple", "Rajrappa Temple & Falls", "Ramgarh", 23.6300, 85.6000, ["culture", "waterfall", "temple"], 120, 0.72, 360, 1200, 100, "RNC", "Temple with scenic waterfall", 4.0, 800, 0.6, True),
            POI("mccluskieganj", "McCluskieganj", "McCluskieganj", 23.6167, 84.9333, ["history", "culture", "heritage"], 120, 0.55, 480, 1080, 300, "RNC", "Anglo-Indian heritage town", 3.5, 200, 0.7, True),
            POI("bodh_gaya", "Bodh Gaya", "Bodh Gaya", 24.6958, 84.9914, ["culture", "temple", "pilgrimage", "unesco"], 240, 0.95, 300, 1200, 200, None, "UNESCO World Heritage Site, place of Buddha's enlightenment", 4.7, 8000, 0.8, True),
            POI("nalanda_ruins", "Nalanda University Ruins", "Nalanda", 25.1358, 85.4436, ["history", "unesco", "education"], 180, 0.8, 480, 1020, 300, None, "Ancient university ruins, UNESCO World Heritage Site", 4.2, 1200, 0.7, True),
            POI("vaishali", "Vaishali", "Vaishali", 25.9981, 85.1356, ["history", "culture", "buddhist"], 150, 0.65, 480, 1020, 150, None, "Ancient city, birthplace of democracy", 3.8, 400, 0.8, True),
            POI("rajgir", "Rajgir", "Rajgir", 25.0258, 85.4203, ["history", "culture", "hot_springs", "buddhist"], 200, 0.8, 360, 1140, 400, None, "Ancient capital with hot springs and Buddhist sites", 4.1, 1500, 0.6, True)
        ]
        self.pois_dict = {poi.id: poi for poi in default_pois}

    def get_all_pois(self) -> List[POI]:
        return list(self.pois_dict.values())

    def add_poi(self, poi: POI):
        self.pois_dict[poi.id] = poi

class TrainDataStorage:
    def __init__(self):
        self.stations: Dict[str, TrainStation] = {}
        self.trains_by_route: Dict[Tuple[str, str], List[Dict]] = {}
        self._initialize_data()

    def _initialize_data(self):
        self.stations = {
            "RNC": TrainStation("RNC", "Ranchi Junction", "Ranchi", 23.37, 85.33),
            "TATA": TrainStation("TATA", "Tatanagar Junction", "Jamshedpur", 22.77, 86.20),
            "JSME": TrainStation("JSME", "Jasidih Junction", "Deoghar", 24.52, 86.65),
            "DTO": TrainStation("DTO", "Daltonganj", "Betla", 24.04, 84.07),
            "BKSC": TrainStation("BKSC", "Bokaro Steel City", "Bokaro", 23.64, 86.15),
            "PNME": TrainStation("PNME", "Parasnath Station", "Parasnath", 23.97, 86.17),
            "LAD": TrainStation("LAD", "Lohardaga", "Netarhat", 23.43, 84.67),
            "CSMT": TrainStation("CSMT", "C.S.M. Terminus", "Mumbai", 18.94, 72.83),
            "NDLS": TrainStation("NDLS", "New Delhi", "Delhi", 28.64, 77.22),
            "HWH": TrainStation("HWH", "Howrah Junction", "Kolkata", 22.58, 88.34),
        }
        
        MOCK_TRAIN_SCHEDULE = [
            {
                "name": "Delhi-Ranchi Rajdhani", "number": "20840",
                "stops": [("NDLS", "16:10", "16:10"), ("BKSC", "08:00", "08:05"), ("RNC", "10:30", "10:30")]
            },
            {
                "name": "Mumbai Mail (to Ranchi)", "number": "12322",
                "stops": [("CSMT", "21:30", "21:30"), ("RNC", "01:30", "01:30")]
            },
            {
                "name": "Kolkata-Ranchi Shatabdi", "number": "12019",
                "stops": [("HWH", "06:05", "06:05"), ("TATA", "09:30", "09:35"), ("RNC", "12:00", "12:00")]
            },
            {
                "name": "Jharkhand Sampark Kranti", "number": "12825",
                "stops": [("RNC", "06:00", "06:00"), ("BKSC", "08:00", "08:05"), ("DHN", "09:30", "09:35"), ("PNME", "10:15", "10:17"), ("JSME", "11:30", "11:30")]
            },
            {
                "name": "Vananchal Express (Return)", "number": "13404",
                "stops": [("JSME", "18:00", "18:00"), ("DHN", "19:30", "19:35"), ("BKSC", "21:00", "21:05"), ("RNC", "23:30", "23:30")]
            },
            {
                "name": "Subarnarekha Express", "number": "13302",
                "stops": [("TATA", "15:30", "15:30"), ("DHN", "18:00", "18:05"), ("PNME", "18:45", "18:47"), ("JSME", "20:00", "20:00")]
            },
            {
                "name": "Tatanagar Intercity", "number": "18101",
                "stops": [("RNC", "08:00", "08:00"), ("TATA", "12:00", "12:00")]
            },
            {
                "name": "Ranchi Intercity", "number": "18102",
                "stops": [("TATA", "14:00", "14:00"), ("RNC", "18:00", "18:00")]
            },
            {
                "name": "Palamu Express", "number": "13348",
                "stops": [("RNC", "19:00", "19:00"), ("LAD", "20:30", "20:32"), ("DTO", "22:00", "22:00")]
            },
            {
                "name": "Palamu Express (Return)", "number": "13347",
                "stops": [("DTO", "05:00", "05:00"), ("LAD", "06:20", "06:22"), ("RNC", "08:00", "08:00")]
            },
        ]

        for train in MOCK_TRAIN_SCHEDULE:
            for i in range(len(train["stops"])):
                for j in range(i + 1, len(train["stops"])):
                    start_id, _, dep_str = train["stops"][i]
                    end_id, arr_str, _ = train["stops"][j]
                    route = (start_id, end_id)
                    if route not in self.trains_by_route:
                        self.trains_by_route[route] = []
                    
                    dep_mins, arr_mins = time_to_minutes(dep_str), time_to_minutes(arr_str)
                    duration = (arr_mins - dep_mins) if arr_mins >= dep_mins else (1440 - dep_mins + arr_mins)
                    if "Mail" in train["name"]:
                        duration += 1440

                    self.trains_by_route[route].append({
                        "name": train["name"],
                        "number": train["number"],
                        "depart_mins": dep_mins,
                        "arrive_mins": arr_mins,
                        "duration_mins": duration
                    })
        for route in self.trains_by_route:
            self.trains_by_route[route].sort(key=lambda x: x["depart_mins"])

    def find_next_train(self, start_id: str, end_id: str, current_mins: int) -> Optional[Dict]:
        route = (start_id, end_id)
        if route not in self.trains_by_route:
            return None
        for t in self.trains_by_route[route]:
            if t["depart_mins"] >= current_mins:
                return t  # same-day train

        # wrap to tomorrow
        if self.trains_by_route[route]:
            t = dict(self.trains_by_route[route][0])  # copy
            t["depart_mins"] += 1440
            t["arrive_mins"] += 1440
            return t
        return None

    def find_station_by_city(self, city: str) -> Optional[TrainStation]:
        for station in self.stations.values():
            if station.city.lower() == city.lower():
                return station
        return None

# Initialize Data Storages
poi_storage = POIStorage()
train_data = TrainDataStorage()

# --------------------
# Journey Calculation
# --------------------
def calculate_journey_details(start_location: Tuple[float, float], end_location: Tuple[float, float], 
                             start_station_id: Optional[str], end_station_id: Optional[str], 
                             current_time: int, end_poi_name: str, transport_mode: str = "car") -> Dict:
    start_lat, start_lon = start_location
    end_lat, end_lon = end_location

    current_time_of_day = current_time % 1440
    
    # If no train stations or train not preferred, use direct road travel
    if not start_station_id or not end_station_id:
    # No stations at either end -> only then allow road
        road_journey = calculate_road_travel(start_lat, start_lon, end_lat, end_lon, transport_mode)
        return {
            "mode": transport_mode,
            "total_time": road_journey["time"],
            "total_cost": road_journey["cost"],
            "arrival_time": current_time + road_journey["time"],
            "details": [f"Travel by {transport_mode} to {end_poi_name} ({road_journey['time']} mins)."]
        }
        
    start_station = train_data.stations.get(start_station_id)
    end_station = train_data.stations.get(end_station_id)
    train = train_data.find_next_train(start_station_id, end_station_id, current_time_of_day)
    if not train or not start_station or not end_station:
        # If user explicitly requested trains but this segment has no train route, fall back to road for this segment.
        # Use "car" as last-mile/mid-city transport for train-unavailable legs.
        road_journey = calculate_road_travel(start_lat, start_lon, end_lat, end_lon, "car")
        return {
            "mode": "car",
            "total_time": road_journey["time"],
            "total_cost": road_journey["cost"],
            "arrival_time": current_time + road_journey["time"],
            "details": [
                "No suitable train found for this segment. Suggesting travel by car.",
                f"Drive to {end_poi_name} ({road_journey['time']} mins)."
            ]
        }
        
    leg1 = calculate_road_travel(start_lat, start_lon, start_station.lat, start_station.lon, "auto")
    time_at_station = current_time + leg1["time"]
    wait_time = train["depart_mins"] - (time_at_station % 1440)
    if wait_time < 0:
        wait_time += 1440
    leg3 = calculate_road_travel(end_station.lat, end_station.lon, end_lat, end_lon, "auto")
    
    total_time = leg1["time"] + wait_time + train["duration_mins"] + leg3["time"]
    ticket_cost = calculate_distance(start_station.lat, start_station.lon, end_station.lat, end_station.lon) * config.TRANSPORT_PROFILES["train"]["cost_km"]
    total_cost = leg1["cost"] + ticket_cost + leg3["cost"]
    
    return {
        "mode": "train",
        "total_time": total_time,
        "total_cost": total_cost,
        "arrival_time": current_time + total_time,
        "details": [
            f"Take auto to {start_station.name} ({leg1['time']} mins).",
            f"Wait {wait_time} mins for {train['name']}.",
            f"Board at {minutes_to_time(train['depart_mins'])}, arrive at {minutes_to_time(train['arrive_mins'])}.",
            f"Take auto to {end_poi_name} ({leg3['time']} mins)."
        ]
    }

# --------------------
# Personalization Engine
# --------------------
class PersonalizationEngine:
    def __init__(self):
        self.category_weights = {
            "nature": 1.0,
            "culture": 1.0,
            "history": 0.9,
            "adventure": 0.8,
            "temple": 0.9,
            "waterfall": 0.7,
            "unesco": 1.0,
            "scenic_drive": 0.6,
            "wildlife": 0.8,
            "viewpoint": 0.6,
            "pilgrimage": 0.9,
            "national_park": 0.9,
            "fort": 0.7,
            "architecture": 0.7,
            "heritage": 0.6,
            "education": 0.8,
            "buddhist": 0.9,
            "hot_springs": 0.7,
            "trekking": 0.8,
            "park": 0.6,
            "leisure": 0.6,
            "garden": 0.6,
            "hill_station": 0.8
        }

    def calculate_interest_score(self, poi: POI, user_interests: List[str]) -> float:
        if not user_interests:
            return 0.5
        score = sum(self.category_weights.get(cat, 0.5) for cat in (set(poi.categories) & set(user_interests)))
        return min(1.0, score / len(user_interests)) if user_interests else 0.5

    def calculate_personalization_score(self, poi: POI, preferences: Dict) -> float:
        score = 0.4 * self.calculate_interest_score(poi, preferences.get('interests', []))
        score += 0.25 * ((poi.popularity + poi.rating / 5.0) / 2.0)
        if preferences.get('accessibility_needs', False):
            score += 0.15 * poi.accessibility_score
        else:
            score += 0.15 * 0.8
        if preferences.get('family_trip', False):
            score += 0.10 * (1.0 if poi.family_friendly else 0.3)
        else:
            score += 0.10 * 0.8
        current_month = datetime.datetime.now().strftime('%b')
        if poi.best_time_to_visit and current_month in poi.best_time_to_visit:
            score += 0.10
        else:
            score += 0.05
        return min(1.0, score)

# --------------------
# Trip Planning Engine
# --------------------
class TripPlanningEngine:
    def __init__(self):
        self.personalization = PersonalizationEngine()

    def filter_and_score_pois(self, all_pois: List[POI], preferences: Dict, base_location: Tuple[float, float]) -> List[POI]:
        base_lat, base_lon = base_location
        scored_pois = []
        for poi in all_pois:
            if not self._passes_filters(poi, preferences):
                continue
            personalization_score = self.personalization.calculate_personalization_score(poi, preferences)
            distance = calculate_distance(base_lat, base_lon, poi.lat, poi.lon)
            distance_score = 1.0 / (1.0 + distance / 100)  # Normalize distance score
            budget_score = 1.0
            if preferences.get('budget'):
                if poi.cost > preferences['budget'] * 0.3:
                    budget_score = 0.3
                elif poi.cost > preferences['budget'] * 0.15:
                    budget_score = 0.7
            final_score = (0.6 * personalization_score + 0.2 * distance_score + 0.2 * budget_score)
            scored_pois.append((final_score, poi))
        
        scored_pois.sort(key=lambda x: x[0], reverse=True)
        return [poi for score, poi in scored_pois]

    def _passes_filters(self, poi: POI, preferences: Dict) -> bool:
        if preferences.get('budget') and poi.cost > preferences['budget'] * 0.4:
            return False
        pace_config = config.PACE_CONFIGS[preferences.get('pace', 'moderate')]
        max_duration = pace_config['daily_hours'] * 60 // 2
        if poi.duration > max_duration:
            return False
        return True

    def optimize_day_route(self, day_pois: List[POI], start_location: Tuple[float, float], 
                          start_city: str, day_start_time: int, day_end_time: int, 
                          transport_mode: str) -> Tuple[List[Dict], Tuple[float, float]]:
        schedule, current_time, current_location = [], day_start_time, start_location
        remaining_pois = day_pois.copy()
        start_station_id = train_data.find_station_by_city(start_city).id if train_data.find_station_by_city(start_city) else None
        
        while remaining_pois and current_time < (day_start_time - (day_start_time % 1440) + day_end_time):
            candidates = []
            for poi in remaining_pois:
                end_station_id_safe = poi.nearest_station_id if (poi.nearest_station_id and poi.nearest_station_id in train_data.stations) else start_station_id
                journey = calculate_journey_details(
                    current_location, (poi.lat, poi.lon), start_station_id, 
                    end_station_id_safe, current_time, poi.name, transport_mode
                )
                
                start_visit_time = max(journey["arrival_time"], current_time - (current_time % 1440) + poi.open_time)
                end_visit_time = start_visit_time + poi.duration

                if end_visit_time < (current_time - (current_time % 1440) + poi.close_time):
                    candidates.append({
                        "poi": poi,
                        "journey": journey,
                        "start_time": start_visit_time,
                        "end_time": end_visit_time
                    })
            
            if not candidates:
                break
            
            best = min(candidates, key=lambda c: c["journey"]["total_time"])
            
            schedule.append({
                "poi": best["poi"],
                "arrival_time": minutes_to_time(best["journey"]["arrival_time"] % 1440),
                "start_time": minutes_to_time(best["start_time"] % 1440),
                "end_time": minutes_to_time(best["end_time"] % 1440),
                "visit_cost": best["poi"].cost,
                "travel_cost": best["journey"]["total_cost"],
                "travel_time": best["journey"]["total_time"],
                "travel_details": best["journey"]["details"]
            })
            current_time = best["end_time"]
            current_location = (best["poi"].lat, best["poi"].lon)
            remaining_pois = [p for p in remaining_pois if p.id != best["poi"].id]
            
        return schedule, current_location

    def generate_itinerary(self, preferences: Dict) -> TripPlan:
        try:
            home_city = preferences.get("home_city", "Mumbai")
            base_location = preferences.get("base_location", None)
            dest_city = preferences.get("destination_city", "Ranchi")
            start_date = datetime.datetime.strptime(preferences.get('start_date', datetime.date.today().isoformat()), '%Y-%m-%d').date()
            num_days_total = preferences.get("num_days", 7)
            transport_mode = preferences.get('transport_mode', 'car')
            default_start_minutes = 8 * 60
            first_day_start_minutes = default_start_minutes
            if transport_mode == "train":
                home_station = train_data.find_station_by_city(home_city)
                dest_station = train_data.find_station_by_city(dest_city)
                if home_station and dest_station:
                    route = (home_station.id, dest_station.id)
                    if route in train_data.trains_by_route and train_data.trains_by_route[route]:
                        earliest_dep = min(t["depart_mins"] for t in train_data.trains_by_route[route])
                        # If the earliest train leaves before the default 08:00, start the day earlier
                        if earliest_dep < default_start_minutes:
                            first_day_start_minutes = earliest_dep
            # Determine starting coordinates
            if base_location:
                try:
                    lat, lon = map(float, base_location)
                    start_location = (lat, lon)
                    home_station_id = None  # No station if custom coordinates provided
                except (ValueError, TypeError):
                    logger.warning("Invalid base_location, falling back to home_city")
                    home_station = train_data.find_station_by_city(home_city)
                    start_location = (home_station.lat, home_station.lon) if home_station else config.DEFAULT_BASE_LOCATION
                    home_station_id = home_station.id if home_station else None
            else:
                home_station = train_data.find_station_by_city(home_city)
                start_location = (home_station.lat, home_station.lon) if home_station else config.DEFAULT_BASE_LOCATION
                home_station_id = home_station.id if home_station else None

            all_pois = poi_storage.get_all_pois()
            selected_pois = self.filter_and_score_pois(all_pois, preferences, start_location)

            pois_by_city = defaultdict(list)
            for poi in selected_pois:
                pois_by_city[poi.city].append(poi)
            
            cities_to_visit = list(pois_by_city.keys())
            if dest_city in cities_to_visit:
                cities_to_visit.remove(dest_city)
            city_sequence = [dest_city] + cities_to_visit
            
            trip_days, day_number, current_date, total_cost = [], 1, start_date, 0.0
            
            dest_station = train_data.find_station_by_city(dest_city)
            if not dest_station:
                dest_station_location = next(((poi.lat, poi.lon) for poi in all_pois if poi.city == dest_city), start_location)
                dest_station_id = None
            else:
                dest_station_location = (dest_station.lat, dest_station.lon)
                dest_station_id = dest_station.id

            journey_to_dest = calculate_journey_details(
                start_location,
                dest_station_location,
                home_station_id,
                dest_station_id,
                first_day_start_minutes,
                dest_city,
                transport_mode
            )
            
            total_journey_time = journey_to_dest["total_time"]
            num_travel_days = (total_journey_time // 1440) + 1
            
            for i in range(num_travel_days):
                if day_number > num_days_total:
                    break
                action_details = {}
                if i == 0:
                    action_details = {"action": f"Departure from {'custom location' if base_location else home_city}", 
                                    "travel_details": journey_to_dest["details"]}
                elif i == num_travel_days - 1:
                    action_details = {"action": f"Arrival in {dest_city}", 
                                    "details": f"Complete journey and arrive in {dest_city}. Check into your accommodation."}
                else:
                    action_details = {"action": "In Transit"}

                daily_travel_time = min(total_journey_time, 1440)
                total_journey_time -= daily_travel_time
                trip_days.append(ItineraryDay(
                    day_number=day_number,
                    date=current_date.isoformat(),
                    pois=[action_details],
                    total_cost=(journey_to_dest["total_cost"] if i == 0 else 0),
                    total_travel_time=daily_travel_time,
                    total_visit_time=0,
                    overnight_location=dest_city if i == num_travel_days - 1 else "In Transit"
                ))
                day_number += 1
                current_date += datetime.timedelta(days=1)
            
            total_cost += journey_to_dest["total_cost"]
            current_location = dest_station_location
            
            for i, city in enumerate(city_sequence):
                city_pois_remaining = pois_by_city[city]
                if not city_pois_remaining:
                    continue

                while city_pois_remaining:
                    if day_number > num_days_total:
                        break
                    
                    day_start_time = (day_number - 1) * 1440 + 8 * 60
                    daily_schedule, end_location = self.optimize_day_route(
                        city_pois_remaining,
                        current_location,
                        city,
                        day_start_time,
                        22 * 60,
                        transport_mode
                    )
                    
                    if not daily_schedule:
                        break

                    scheduled_poi_ids = {item['poi'].id for item in daily_schedule}
                    city_pois_remaining = [p for p in city_pois_remaining if p.id not in scheduled_poi_ids]
                    
                    current_location = end_location
                    day_cost = sum(item['visit_cost'] + item['travel_cost'] for item in daily_schedule)
                    total_cost += day_cost

                    serializable_schedule = []
                    for item in daily_schedule:
                        item_copy = item.copy()
                        item_copy['poi'] = asdict(item_copy['poi'])
                        serializable_schedule.append(item_copy)
                    
                    trip_days.append(ItineraryDay(
                        day_number=day_number,
                        date=current_date.isoformat(),
                        pois=serializable_schedule,
                        total_cost=day_cost,
                        total_travel_time=sum(item['travel_time'] for item in daily_schedule),
                        total_visit_time=sum(item['poi']['duration'] for item in serializable_schedule),
                        overnight_location=city
                    ))
                    day_number += 1
                    current_date += datetime.timedelta(days=1)
                
                if day_number > num_days_total:
                    break

                if i < len(city_sequence) - 1:
                    next_city = city_sequence[i+1]
                    if not pois_by_city[next_city]:
                        continue

                    start_st = train_data.find_station_by_city(city)
                    end_st = train_data.find_station_by_city(next_city)

                    if not start_st or not end_st:
                        start_st_location = current_location
                        end_st_location = next(((poi.lat, poi.lon) for poi in all_pois if poi.city == next_city), start_location)
                        start_st_id, end_st_id = None, None
                    else:
                        start_st_location = (start_st.lat, start_st.lon)
                        end_st_location = (end_st.lat, end_st.lon)
                        start_st_id, end_st_id = start_st.id, end_st.id

                    intercity_journey = calculate_journey_details(
                        current_location,
                        end_st_location,
                        start_st_id,
                        end_st_id,
                        (day_number-1)*1440 + 8 * 60,
                        next_city,
                        transport_mode
                    )
                    total_cost += intercity_journey["total_cost"]
                    trip_days.append(ItineraryDay(
                        day_number=day_number,
                        date=current_date.isoformat(),
                        pois=[{
                            "action": f"Travel from {city} to {next_city}",
                            "travel_details": intercity_journey["details"]
                        }],
                        total_cost=intercity_journey["total_cost"],
                        total_travel_time=intercity_journey["total_time"],
                        total_visit_time=0,
                        overnight_location=next_city
                    ))
                    current_location = end_st_location
                    day_number += 1
                    current_date += datetime.timedelta(days=1)
            
            # Enforce budget constraints
            budget = preferences.get('budget', config.DEFAULT_BUDGET)
            if total_cost > budget:
                all_items = []
                for day in trip_days:
                    for item in day.pois:
                        if item.get('poi'):
                            all_items.append((item['visit_cost'] + item['travel_cost'], item, day))
                all_items.sort(key=lambda x: x[0], reverse=True)
                excess = total_cost - budget
                removed_cost = 0
                for cost, item, day in all_items:
                    if removed_cost >= excess:
                        break
                    day.pois = [p for p in day.pois if p != item]
                    removed_cost += cost
                    day.total_cost -= cost
                    day.total_visit_time -= item['poi']['duration'] if 'duration' in item['poi'] else 0
                    day.total_travel_time -= item.get('travel_time', 0)
                total_cost = sum(day.total_cost for day in trip_days)

            scheduled_poi_count = sum(len(day.pois) for day in trip_days if day.pois and 'action' not in day.pois[0])
            trip_plan = TripPlan(
                days=trip_days,
                total_cost=total_cost,
                total_pois=scheduled_poi_count,
                user_preferences=preferences,
                generated_at=datetime.datetime.now().isoformat()
            )
            logger.info(f"Generated itinerary with {scheduled_poi_count} POIs over {num_days_total} days")
            return trip_plan

        except Exception as e:
            logger.error(f"Error generating itinerary: {e}", exc_info=True)
            return self._create_empty_trip_plan(preferences)

    def _create_empty_trip_plan(self, preferences: Dict) -> TripPlan:
        num_days = preferences.get('num_days', 5)
        start_date = datetime.datetime.strptime(
            preferences.get('start_date', datetime.date.today().isoformat()),
            '%Y-%m-%d'
        ).date()
        empty_days = []
        for day_num in range(num_days):
            current_date = start_date + datetime.timedelta(days=day_num)
            empty_days.append(ItineraryDay(
                day_number=day_num + 1,
                date=current_date.isoformat(),
                pois=[],
                total_cost=0.0,
                total_travel_time=0,
                total_visit_time=0,
                overnight_location=preferences.get('destination_city', 'Ranchi')
            ))
        return TripPlan(
            days=empty_days,
            total_cost=0.0,
            total_pois=0,
            user_preferences=preferences,
            generated_at=datetime.datetime.now().isoformat()
        )

# Initialize trip planning engine
trip_planner = TripPlanningEngine()

# --------------------
# Flask API Endpoints
# --------------------
@app.route('/api/available-pois', methods=['GET'])
def get_available_pois():
    try:
        all_pois = poi_storage.get_all_pois()
        pois_json = [
            {
                'id': poi.id,
                'name': poi.name,
                'city': poi.city,
                'categories': poi.categories,
                'description': poi.description,
                'rating': poi.rating,
                'review_count': poi.review_count,
                'duration': poi.duration,
                'cost': poi.cost,
                'best_time_to_visit': poi.best_time_to_visit or ['Year-round'],
                'family_friendly': poi.family_friendly,
                'accessibility_score': poi.accessibility_score,
                'lat': poi.lat,
                'lon': poi.lon
            } for poi in all_pois
        ]
        return jsonify({
            'status': 'success',
            'data': pois_json
        }), 200
    except Exception as e:
        logger.error(f"Error fetching POIs: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to fetch POIs: {str(e)}'
        }), 500

@app.route('/api/generate-itinerary', methods=['POST'])
def generate_itinerary():
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No input data provided'
            }), 400
        
        preferences = {
            'num_days': int(data.get('num_days', 7)),
            'budget': float(data.get('budget', config.DEFAULT_BUDGET)),
            'start_date': data.get('start_date', datetime.date.today().isoformat()),
            'home_city': data.get('home_city', 'Mumbai'),
            'base_location': data.get('base_location', None),  # Accept [lat, lon]
            'destination_city': data.get('destination_city', 'Ranchi'),
            'interests': data.get('interests', []),
            'family_trip': bool(data.get('family_trip', False)),
            'accessibility_needs': bool(data.get('accessibility_needs', False)),
            'transport_mode': data.get('transport_mode', 'car'),
            'pace': data.get('pace', 'moderate'),
            'must_visit': data.get('must_visit', [])
        }
        
        available_categories = list(set(trip_planner.personalization.category_weights.keys()))
        preferences['interests'] = [i.lower() for i in preferences['interests'] if i.lower() in available_categories]
        valid_poi_ids = {poi.id for poi in poi_storage.get_all_pois()}
        preferences['must_visit'] = [pid for pid in preferences['must_visit'] if pid in valid_poi_ids]
        preferences['pace'] = preferences['pace'].lower() if preferences['pace'].lower() in config.PACE_CONFIGS else 'moderate'
        preferences['transport_mode'] = preferences['transport_mode'].lower() if preferences['transport_mode'].lower() in config.TRANSPORT_PROFILES else 'car'

        # Validate base_location
        if preferences['base_location']:
            try:
                lat, lon = map(float, preferences['base_location'])
                preferences['base_location'] = (lat, lon)
            except (ValueError, TypeError):
                logger.warning("Invalid base_location provided, ignoring")
                preferences['base_location'] = None

        trip_plan = trip_planner.generate_itinerary(preferences)
        return jsonify({
            'status': 'success',
            'data': asdict(trip_plan)
        }), 200
    except Exception as e:
        logger.error(f"Error in itinerary generation endpoint: {e}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'An internal error occurred: {e}'
        }), 500

@app.route('/api/options', methods=['GET'])
def get_options():
    try:
        return jsonify({
            'status': 'success',
            'data': {
                'transport_modes': list(config.TRANSPORT_PROFILES.keys()),
                'pace_options': list(config.PACE_CONFIGS.keys()),
                'available_categories': list(set(trip_planner.personalization.category_weights.keys())),
                'default_budget': config.DEFAULT_BUDGET,
                'max_pois_per_day': config.MAX_POIS_PER_DAY,
                'min_pois_per_day': config.MIN_POIS_PER_DAY
            }
        }), 200
    except Exception as e:
        logger.error(f"Error fetching options: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to fetch options: {str(e)}'
        }), 500

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(force=True)
        user_message = data.get("message", "")
        
        if not user_message:
            return jsonify({"error": "Message is required"}), 400
        
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": """You are a multilingual travel assistant for Jharkhand, India.
                    Answer concisely but include key facts (history, best season, transport, local food).
                    If user's language is not Hindi or English, detect and reply in that language.
                    When giving places, add short lat/long or nearest city for map use.
                    Focus on Jharkhand's attractions like:
                    - Waterfalls: Hundru Falls, Dassam Falls, Jonha Falls
                    - Hills: Parasnath Hill, Netarhat, Tagore Hill
                    - Wildlife: Betla National Park, Dalma Wildlife Sanctuary
                    - Tribal culture: Santhal, Munda, Oraon tribes
                    - Festivals: Sarhul, Karma, Tusu
                    - Cities: Ranchi, Jamshedpur, Dhanbad, Bokaro
                    """
                },
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        bot_response = completion.choices[0].message.content
        return jsonify({"response": bot_response})
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            "response": "I'm having trouble processing your request right now. Please try asking about Jharkhand's waterfalls, trekking spots, or tribal culture."
        }), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "service": "Jharkhand Travel Chatbot"})

# Initialize Groq client with your API key
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# --------------------
# Main Application Entry Point
# --------------------
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)