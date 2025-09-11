"""
Enhanced AI-based Personalized Itinerary Planner
Flask API version for website integration

Required packages:
pip install flask ortools pandas numpy geopy
"""

import math
import datetime
import json
import logging
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Tuple, Any
import numpy as np
import pandas as pd
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
from geopy.distance import geodesic
from functools import lru_cache
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# --------------------
# Enhanced Configuration
# --------------------
class Config:
    MAX_POIS_PER_DAY = 6
    MIN_POIS_PER_DAY = 2
    DEFAULT_BUDGET = 50000
    
    TRANSPORT_PROFILES = {
        "car": {"speed": 50.0, "cost_km": 8.0, "comfort": 0.9, "flexibility": 1.0},
        "bus": {"speed": 35.0, "cost_km": 3.0, "comfort": 0.6, "flexibility": 0.7},
        "train": {"speed": 70.0, "cost_km": 2.0, "comfort": 0.8, "flexibility": 0.5},
        "bike": {"speed": 25.0, "cost_km": 2.0, "comfort": 0.4, "flexibility": 0.9},
        "auto": {"speed": 30.0, "cost_km": 12.0, "comfort": 0.5, "flexibility": 0.8}
    }
    
    PACE_CONFIGS = {
        "relaxed": {"daily_hours": 6, "max_travel_hours": 2, "rest_buffer": 60},
        "moderate": {"daily_hours": 8, "max_travel_hours": 3, "rest_buffer": 45},
        "fast": {"daily_hours": 10, "max_travel_hours": 4, "rest_buffer": 30}
    }

config = Config()

# --------------------
# Enhanced Data Models
# --------------------
@dataclass
class POI:
    id: str
    name: str
    lat: float
    lon: float
    categories: List[str]
    duration: int
    popularity: float
    open_time: int
    close_time: int
    cost: float
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
class ItineraryDay:
    day_number: int
    date: str
    pois: List[Dict]
    total_cost: float
    total_travel_time: int
    total_visit_time: int
    transport_mode: str
    
@dataclass
class TripPlan:
    days: List[ItineraryDay]
    total_cost: float
    total_pois: int
    user_preferences: Dict
    generated_at: str

# --------------------
# In-memory POI Storage
# --------------------
class POIStorage:
    def __init__(self):
        self.pois = []
        self._initialize_default_pois()
    
    def _initialize_default_pois(self):
        default_pois = [
            POI("betla_np", "Betla National Park", 23.8500, 84.2100, ["nature", "wildlife", "adventure"],
                240, 0.9, 6*60, 17*60+30, 1500, "Famous tiger reserve with diverse wildlife", 4.3, 1250, 0.7, True, ["Oct", "Nov", "Dec", "Jan", "Feb"]),
            POI("netarhat", "Netarhat Hills", 23.4800, 84.2700, ["nature", "viewpoint", "hill_station"],
                180, 0.85, 5*60+30, 19*60, 800, "Queen of Chotanagpur with stunning sunrise views", 4.1, 890, 0.8, True, ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]),
            POI("hundru_falls", "Hundru Falls", 23.5100, 85.4200, ["nature", "waterfall", "adventure"],
                120, 0.75, 6*60, 18*60, 200, "98m high waterfall, spectacular during monsoons", 4.0, 2100, 0.6, True, ["Jul", "Aug", "Sep", "Oct"]),
            POI("jonha_falls", "Jonha Falls", 23.3600, 85.2500, ["nature", "waterfall"],
                100, 0.7, 7*60, 17*60, 150, "Beautiful waterfall with natural pool", 3.8, 1500, 0.7, True, ["Jul", "Aug", "Sep", "Oct"]),
            POI("patratu_valley", "Patratu Valley", 23.6300, 85.2700, ["nature", "scenic_drive", "lake"],
                90, 0.65, 6*60, 19*60, 100, "Scenic valley with beautiful lake views", 3.9, 950, 0.8, True),
            POI("deoghar_temple", "Baidyanath Temple Deoghar", 24.4800, 86.7000, ["culture", "temple", "pilgrimage"],
                150, 0.9, 4*60, 22*60, 50, "One of 12 Jyotirlingas, major pilgrimage site", 4.5, 5000, 0.5, True),
            POI("rajrappa_temple", "Rajrappa Temple & Falls", 23.6300, 85.6000, ["culture", "waterfall", "temple"],
                120, 0.72, 6*60, 20*60, 100, "Temple with scenic waterfall", 4.0, 800, 0.6, True),
            POI("palamu_fort", "Palamu Fort", 24.1200, 83.5200, ["history", "fort", "architecture"],
                150, 0.6, 9*60, 17*60, 200, "Historic fort with Mughal architecture", 3.7, 400, 0.5, True, ["Oct", "Nov", "Dec", "Jan", "Feb"]),
            POI("hazaribagh_np", "Hazaribagh National Park", 23.9800, 85.3600, ["nature", "wildlife"],
                180, 0.75, 6*60, 17*60, 1200, "Wildlife sanctuary with tigers and leopards", 4.0, 600, 0.6, True, ["Nov", "Dec", "Jan", "Feb", "Mar"]),
            POI("mccluskieganj", "McCluskieganj", 23.6167, 84.9333, ["history", "culture", "heritage"],
                120, 0.55, 8*60, 18*60, 300, "Anglo-Indian heritage town", 3.5, 200, 0.7, True),
            POI("bodh_gaya", "Bodh Gaya", 24.6958, 84.9914, ["culture", "temple", "pilgrimage", "unesco"],
                240, 0.95, 5*60, 20*60, 200, "UNESCO World Heritage Site, place of Buddha's enlightenment", 4.7, 8000, 0.8, True),
            POI("nalanda_ruins", "Nalanda University Ruins", 25.1358, 85.4436, ["history", "unesco", "education"],
                180, 0.8, 8*60, 17*60, 300, "Ancient university ruins, UNESCO World Heritage Site", 4.2, 1200, 0.7, True),
            POI("vaishali", "Vaishali", 25.9981, 85.1356, ["history", "culture", "buddhist"],
                150, 0.65, 8*60, 17*60, 150, "Ancient city, birthplace of democracy", 3.8, 400, 0.8, True),
            POI("rajgir", "Rajgir", 25.0258, 85.4203, ["history", "culture", "hot_springs", "buddhist"],
                200, 0.8, 6*60, 19*60, 400, "Ancient capital with hot springs and Buddhist sites", 4.1, 1500, 0.6, True),
        ]
        self.pois = default_pois
    
    def get_all_pois(self) -> List[POI]:
        return self.pois.copy()
    
    def add_poi(self, poi: POI):
        self.pois.append(poi)

# Initialize POI storage
poi_storage = POIStorage()

# --------------------
# Enhanced Utility Functions
# --------------------
@lru_cache(maxsize=1000)
def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    return geodesic((lat1, lon1), (lat2, lon2)).kilometers

def calculate_travel_time(lat1: float, lon1: float, lat2: float, lon2: float, 
                         transport_mode: str = "car") -> int:
    profile = config.TRANSPORT_PROFILES.get(transport_mode, config.TRANSPORT_PROFILES["car"])
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
    base_time = (distance / effective_speed) * 60
    return int(base_time * traffic_factor)

def calculate_travel_cost(lat1: float, lon1: float, lat2: float, lon2: float, 
                         transport_mode: str = "car") -> float:
    profile = config.TRANSPORT_PROFILES.get(transport_mode, config.TRANSPORT_PROFILES["car"])
    distance = calculate_distance(lat1, lon1, lat2, lon2)
    return distance * profile["cost_km"]

def time_to_minutes(time_str: str) -> int:
    if not time_str or time_str == "--:--":
        return 0
    try:
        h, m = map(int, time_str.split(':'))
        return h * 60 + m
    except:
        return 0

def minutes_to_time(minutes: int) -> str:
    if minutes < 0:
        return "--:--"
    h = minutes // 60
    m = minutes % 60
    return f"{h:02d}:{m:02d}"

# --------------------
# Enhanced Scoring System
# --------------------
class PersonalizationEngine:
    def __init__(self):
        self.category_weights = {
            "nature": 1.0,
            "culture": 1.0,
            "history": 0.9,
            "adventure": 0.8,
            "temple": 0.9,
            "wildlife": 0.8,
            "waterfall": 0.7,
            "viewpoint": 0.6,
            "pilgrimage": 0.9,
            "unesco": 1.0
        }
    
    def calculate_interest_score(self, poi: POI, user_interests: List[str]) -> float:
        if not user_interests:
            return 0.5
        score = 0.0
        matching_categories = set(poi.categories) & set(user_interests)
        for category in matching_categories:
            weight = self.category_weights.get(category, 0.5)
            score += weight
        return min(1.0, score / len(user_interests))
    
    def calculate_personalization_score(self, poi: POI, preferences: Dict) -> float:
        score = 0.0
        interest_score = self.calculate_interest_score(poi, preferences.get('interests', []))
        score += 0.4 * interest_score
        popularity_score = (poi.popularity + poi.rating / 5.0) / 2.0
        score += 0.25 * popularity_score
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
# Advanced Trip Planning Engine
# --------------------
class TripPlanningEngine:
    def __init__(self):
        self.personalization = PersonalizationEngine()
    
    def filter_and_score_pois(self, all_pois: List[POI], preferences: Dict, 
                             base_location: Tuple[float, float]) -> List[Tuple[float, POI]]:
        base_lat, base_lon = base_location
        scored_pois = []
        for poi in all_pois:
            if not self._passes_filters(poi, preferences):
                continue
            personalization_score = self.personalization.calculate_personalization_score(poi, preferences)
            distance = calculate_distance(base_lat, base_lon, poi.lat, poi.lon)
            distance_score = 1.0 / (1.0 + distance / 100)
            budget_score = 1.0
            if preferences.get('budget'):
                if poi.cost > preferences['budget'] * 0.3:
                    budget_score = 0.3
                elif poi.cost > preferences['budget'] * 0.15:
                    budget_score = 0.7
            final_score = (0.6 * personalization_score + 0.2 * distance_score + 0.2 * budget_score)
            scored_pois.append((final_score, poi))
        return sorted(scored_pois, key=lambda x: x[0], reverse=True)
    
    def _passes_filters(self, poi: POI, preferences: Dict) -> bool:
        if preferences.get('budget') and poi.cost > preferences['budget'] * 0.4:
            return False
        pace_config = config.PACE_CONFIGS[preferences.get('pace', 'moderate')]
        max_duration = pace_config['daily_hours'] * 60 // 2
        if poi.duration > max_duration:
            return False
        return True
    
    def assign_pois_to_days(self, selected_pois: List[POI], num_days: int, 
                           preferences: Dict) -> List[List[POI]]:
        days = [[] for _ in range(num_days)]
        day_durations = [0] * num_days
        day_costs = [0.0] * num_days
        pace_config = config.PACE_CONFIGS[preferences.get('pace', 'moderate')]
        max_daily_minutes = pace_config['daily_hours'] * 60
        budget_per_day = preferences.get('budget', config.DEFAULT_BUDGET) / num_days
        must_visit = preferences.get('must_visit', [])
        priority_pois = []
        regular_pois = []
        for poi in selected_pois:
            if poi.id in must_visit:
                priority_pois.append(poi)
            else:
                regular_pois.append(poi)
        for i, poi in enumerate(priority_pois):
            day_idx = i % num_days
            if (day_durations[day_idx] + poi.duration <= max_daily_minutes and 
                day_costs[day_idx] + poi.cost <= budget_per_day):
                days[day_idx].append(poi)
                day_durations[day_idx] += poi.duration
                day_costs[day_idx] += poi.cost
        for poi in regular_pois:
            best_day = -1
            min_load = float('inf')
            for day_idx in range(num_days):
                if (day_durations[day_idx] + poi.duration <= max_daily_minutes and 
                    day_costs[day_idx] + poi.cost <= budget_per_day):
                    time_load = day_durations[day_idx] / max_daily_minutes
                    cost_load = day_costs[day_idx] / budget_per_day
                    combined_load = (time_load + cost_load) / 2
                    if combined_load < min_load:
                        min_load = combined_load
                        best_day = day_idx
            if best_day >= 0:
                days[best_day].append(poi)
                day_durations[best_day] += poi.duration
                day_costs[best_day] += poi.cost
        return days
    
    def optimize_day_route(self, day_pois: List[POI], start_location: Tuple[float, float],
                          transport_mode: str, day_start: int, day_end: int, 
                          return_to_base: bool = False, base_location: Optional[Tuple[float, float]] = None) -> List[Dict]:
        if not day_pois:
            return []
        if return_to_base and base_location is None:
            raise ValueError("base_location required when return_to_base is True")
        
        # Use greedy nearest neighbor for simplicity and to handle open paths easily
        schedule = []
        current_time = day_start
        current_lat, current_lon = start_location
        remaining_pois = day_pois.copy()
        
        # Visit all POIs in greedy order
        while remaining_pois:
            # Find nearest feasible POI
            candidates = []
            for poi in remaining_pois:
                travel_time = calculate_travel_time(current_lat, current_lon, poi.lat, poi.lon, transport_mode)
                arrival_time = current_time + travel_time
                start_time = max(arrival_time, poi.open_time)
                end_time = start_time + poi.duration
                if end_time <= day_end:  # Ensure within day_end (24*60)
                    feasible_time = end_time - day_start
                    if feasible_time <= 24 * 60:  # Ensure total <=24 hours
                        candidates.append((calculate_distance(current_lat, current_lon, poi.lat, poi.lon), poi, travel_time, arrival_time, start_time, end_time))
            
            if not candidates:
                # No feasible, skip or break
                break
            
            # Sort by distance
            candidates.sort(key=lambda x: x[0])
            _, nearest_poi, travel_time, arrival_time, start_time, end_time = candidates[0]
            remaining_pois.remove(nearest_poi)
            
            travel_cost = calculate_travel_cost(current_lat, current_lon, nearest_poi.lat, nearest_poi.lon, transport_mode)
            schedule.append({
                "poi": nearest_poi,
                "arrival_time": minutes_to_time(arrival_time),
                "start_time": minutes_to_time(start_time),
                "end_time": minutes_to_time(end_time),
                "visit_cost": nearest_poi.cost,
                "travel_cost": travel_cost,
                "travel_time": travel_time
            })
            current_time = end_time
            current_lat, current_lon = nearest_poi.lat, nearest_poi.lon
        
        # Add return to base if required (last day) - always add cost, even if time exceeds
        if return_to_base and schedule:
            last_lat, last_lon = current_lat, current_lon
            return_travel_time = calculate_travel_time(last_lat, last_lon, base_location[0], base_location[1], transport_mode)
            return_cost = calculate_travel_cost(last_lat, last_lon, base_location[0], base_location[1], transport_mode)
            return_arrival = current_time + return_travel_time
            schedule.append({
                "poi": None,
                "arrival_time": minutes_to_time(return_arrival),
                "travel_cost": return_cost,
                "travel_time": return_travel_time,
                "action": "return_to_base"
            })
        
        return schedule
    
    def generate_itinerary(self, preferences: Dict) -> TripPlan:
        try:
            num_days = preferences.get('num_days', 5)
            base_location = preferences.get('base_location', (23.36, 85.33))
            transport_mode = preferences.get('transport_mode', 'car')
            all_pois = poi_storage.get_all_pois()
            if not all_pois:
                logger.warning("No POIs found in storage")
                return self._create_empty_trip_plan(preferences)
            scored_pois = self.filter_and_score_pois(all_pois, preferences, base_location)
            if not scored_pois:
                logger.warning("No POIs passed filtering criteria")
                return self._create_empty_trip_plan(preferences)
            pace_config = config.PACE_CONFIGS[preferences.get('pace', 'moderate')]
            target_pois_per_day = min(config.MAX_POIS_PER_DAY, 
                                    max(config.MIN_POIS_PER_DAY, 
                                        pace_config['daily_hours'] // 2))
            max_total_pois = num_days * target_pois_per_day
            selected_pois = [poi for _, poi in scored_pois[:max_total_pois]]
            daily_pois = self.assign_pois_to_days(selected_pois, num_days, preferences)
            trip_days = []
            total_cost = 0.0
            start_date = datetime.datetime.strptime(
                preferences.get('start_date', datetime.date.today().isoformat()), 
                '%Y-%m-%d'
            ).date()
            day_start = preferences.get('day_start', 1 * 60)  # Start from 1:00
            day_end = preferences.get('day_end', 24 * 60)    # End at 24:00
            current_location = base_location
            
            for day_num in range(num_days):
                current_date = start_date + datetime.timedelta(days=day_num)
                day_pois_list = daily_pois[day_num] if day_num < len(daily_pois) else []
                return_to_base = (day_num == num_days - 1)
                daily_schedule = self.optimize_day_route(
                    day_pois_list, current_location, transport_mode, day_start, day_end, 
                    return_to_base=return_to_base, base_location=base_location
                )
                day_cost = sum(item.get('visit_cost', 0) + item.get('travel_cost', 0) 
                             for item in daily_schedule)
                day_travel_time = sum(item.get('travel_time', 0) for item in daily_schedule)
                day_visit_time = sum(item['poi'].duration for item in daily_schedule if item.get('poi'))
                
                # Update current_location to last visited POI for next day
                if daily_schedule and not return_to_base:
                    last_item = daily_schedule[-1]
                    if last_item.get('poi'):
                        current_location = (last_item['poi'].lat, last_item['poi'].lon)
                
                serializable_schedule = []
                for item in daily_schedule:
                    schedule_item = item.copy()
                    if item.get('poi'):
                        schedule_item['poi'] = {
                            'id': item['poi'].id,
                            'name': item['poi'].name,
                            'lat': item['poi'].lat,
                            'lon': item['poi'].lon,
                            'categories': item['poi'].categories,
                            'duration': item['poi'].duration,
                            'cost': item['poi'].cost,
                            'description': item['poi'].description,
                            'rating': item['poi'].rating,
                            'review_count': item['poi'].review_count
                        }
                    serializable_schedule.append(schedule_item)
                day_itinerary = ItineraryDay(
                    day_number=day_num + 1,
                    date=current_date.isoformat(),
                    pois=serializable_schedule,
                    total_cost=day_cost,
                    total_travel_time=day_travel_time,
                    total_visit_time=day_visit_time,
                    transport_mode=transport_mode
                )
                trip_days.append(day_itinerary)
                total_cost += day_cost
            
            # Enforce total budget: remove expensive items if exceed
            budget = preferences.get('budget', config.DEFAULT_BUDGET)
            if total_cost > budget:
                # Simple: scale down by removing highest cost items across days
                all_items = []
                for day in trip_days:
                    for item in day.pois:
                        if item.get('poi'):
                            all_items.append((item['visit_cost'] + item.get('travel_cost', 0), item, day))
                all_items.sort(key=lambda x: x[0], reverse=True)
                excess = total_cost - budget
                removed_cost = 0
                for cost, item, day in all_items:
                    if removed_cost >= excess:
                        break
                    # Remove from day
                    day.pois = [p for p in day.pois if p != item]
                    removed_cost += cost
                    day.total_cost -= cost
                    day.total_visit_time -= item['poi']['duration'] if 'duration' in item['poi'] else 0
                    day.total_travel_time -= item.get('travel_time', 0)
                total_cost = sum(day.total_cost for day in trip_days)
            
            trip_plan = TripPlan(
                days=trip_days,
                total_cost=total_cost,
                total_pois=len(selected_pois),
                user_preferences=preferences,
                generated_at=datetime.datetime.now().isoformat()
            )
            logger.info(f"Generated itinerary with {len(selected_pois)} POIs over {num_days} days")
            return trip_plan
        except Exception as e:
            logger.error(f"Error generating itinerary: {str(e)}")
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
                transport_mode=preferences.get('transport_mode', 'car')
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
    """Return all available POIs as JSON"""
    try:
        all_pois = poi_storage.get_all_pois()
        pois_json = [
            {
                'id': poi.id,
                'name': poi.name,
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
    """Generate itinerary based on user preferences from frontend"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No input data provided'
            }), 400
        
        # Validate and process preferences
        preferences = {}
        
        # Number of days
        num_days = data.get('num_days', 5)
        try:
            preferences['num_days'] = max(1, min(15, int(num_days)))
        except (ValueError, TypeError):
            preferences['num_days'] = 5
        
        # Budget
        budget = data.get('budget', 15000)
        try:
            preferences['budget'] = max(1000, float(budget))
        except (ValueError, TypeError):
            preferences['budget'] = 15000
        
        # Transport mode
        transport_mode = data.get('transport_mode', 'car').lower()
        preferences['transport_mode'] = transport_mode if transport_mode in config.TRANSPORT_PROFILES else 'car'
        
        # Travel pace
        pace = data.get('pace', 'moderate').lower()
        preferences['pace'] = pace if pace in config.PACE_CONFIGS else 'moderate'
        
        # Base location
        base_location = data.get('base_location', [23.36, 85.33])
        try:
            lat, lon = map(float, base_location)
            preferences['base_location'] = (lat, lon)
        except (ValueError, TypeError):
            preferences['base_location'] = (23.36, 85.33)
        
        # Interests
        interests = data.get('interests', [])
        available_categories = ["nature", "culture", "history", "adventure", "temple", 
                              "wildlife", "waterfall", "viewpoint", "pilgrimage", "unesco"]
        preferences['interests'] = [i.lower() for i in interests if i.lower() in available_categories]
        
        # Additional preferences
        preferences['accessibility_needs'] = bool(data.get('accessibility_needs', False))
        preferences['family_trip'] = bool(data.get('family_trip', False))
        
        # Start date
        start_date = data.get('start_date', datetime.date.today().isoformat())
        try:
            datetime.datetime.strptime(start_date, '%Y-%m-%d')
            preferences['start_date'] = start_date
        except (ValueError, TypeError):
            preferences['start_date'] = datetime.date.today().isoformat()
        
        # Must-visit locations
        must_visit = data.get('must_visit', [])
        valid_poi_ids = {poi.id for poi in poi_storage.get_all_pois()}
        preferences['must_visit'] = [pid for pid in must_visit if pid in valid_poi_ids]
        
        # Generate itinerary
        trip_plan = trip_planner.generate_itinerary(preferences)
        
        # Convert to JSON-serializable format
        trip_dict = {
            'days': [asdict(day) for day in trip_plan.days],
            'total_cost': trip_plan.total_cost,
            'total_pois': trip_plan.total_pois,
            'user_preferences': trip_plan.user_preferences,
            'generated_at': trip_plan.generated_at
        }
        
        return jsonify({
            'status': 'success',
            'data': trip_dict
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating itinerary: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to generate itinerary: {str(e)}'
        }), 500

@app.route('/api/options', methods=['GET'])
def get_options():
    """Return available configuration options for the frontend"""
    try:
        return jsonify({
            'status': 'success',
            'data': {
                'transport_modes': list(config.TRANSPORT_PROFILES.keys()),
                'pace_options': list(config.PACE_CONFIGS.keys()),
                'available_categories': ["nature", "culture", "history", "adventure", "temple", 
                                      "wildlife", "waterfall", "viewpoint", "pilgrimage", "unesco"],
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

# --------------------
# Main Application Entry Point
# --------------------
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)