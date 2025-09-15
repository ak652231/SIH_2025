import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    try {
      // Attempt to call Python Flask backend
      const pythonResponse = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (pythonResponse.ok) {
        const data = await pythonResponse.json();
        return NextResponse.json({ response: data.response });
      }
    } catch (pythonError) {
      console.log("Python backend not available, using fallback responses");
    }

    const jharkhandResponses = [
      "🏔️ **Waterfalls of Jharkhand**: Hundru Falls (98m, near Ranchi), Dassam Falls (44m, 40km from Ranchi), and Jonha Falls are must-visits. Best time: July-October during monsoon. Coordinates: Hundru Falls (23.4241°N, 85.6044°E).",

      "🎭 **Tribal Heritage**: Jharkhand is home to 32 tribal communities including Santhal, Munda, and Oraon. Experience authentic culture during Sarhul (spring festival, March-April) and Karma (August-September). Visit Tribal Research Institute in Ranchi for deeper insights.",

      "🥾 **Trekking Adventures**: Parasnath Hill (1365m, highest peak) offers spiritual trekking with Jain temples. Netarhat (1128m) is the 'Queen of Chotanagpur' with sunrise/sunset points. Best season: October-March. Local guides available in both locations.",

      "🍛 **Local Cuisine**: Try Litti Chokha (roasted wheat balls with spiced vegetables), Rugra (mushroom curry), and Bamboo shoot preparations. Don't miss Handia (traditional rice beer) and Mahua-based drinks. Best food markets: Main Road Ranchi, Sakchi Jamshedpur.",

      "🦌 **Wildlife Sanctuaries**: Betla National Park (Palamau) for tigers and elephants, Dalma Wildlife Sanctuary for elephant herds. Entry fees: ₹25 Indians, ₹300 foreigners. Best time: November-April. Book forest rest houses in advance.",

      "🏛️ **Cultural Sites**: Jagannath Temple Ranchi, Baidyanath Dham Deoghar (one of 12 Jyotirlingas), and Sun Temple Bundu. Deoghar is 250km from Ranchi. During Shravan month (July-August), millions visit for Kanwar Yatra.",
    ];

    // Simulate API delay for realistic experience
    await new Promise((resolve) => setTimeout(resolve, 800));

    let selectedResponse =
      jharkhandResponses[Math.floor(Math.random() * jharkhandResponses.length)];

    const messageLower = message.toLowerCase();
    if (messageLower.includes("waterfall") || messageLower.includes("falls")) {
      selectedResponse = jharkhandResponses[0];
    } else if (
      messageLower.includes("tribal") ||
      messageLower.includes("culture") ||
      messageLower.includes("festival")
    ) {
      selectedResponse = jharkhandResponses[1];
    } else if (
      messageLower.includes("trek") ||
      messageLower.includes("hill") ||
      messageLower.includes("mountain")
    ) {
      selectedResponse = jharkhandResponses[2];
    } else if (
      messageLower.includes("food") ||
      messageLower.includes("cuisine") ||
      messageLower.includes("eat")
    ) {
      selectedResponse = jharkhandResponses[3];
    } else if (
      messageLower.includes("wildlife") ||
      messageLower.includes("animal") ||
      messageLower.includes("safari")
    ) {
      selectedResponse = jharkhandResponses[4];
    } else if (
      messageLower.includes("temple") ||
      messageLower.includes("religious") ||
      messageLower.includes("spiritual")
    ) {
      selectedResponse = jharkhandResponses[5];
    }

    return NextResponse.json({ response: selectedResponse });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
