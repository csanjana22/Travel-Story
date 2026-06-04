import json
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

SYSTEM_INSTRUCTION = (
    "You are a precise travel assistant. Always ensure budget totals are calculated "
    "correctly. If a user provides invalid inputs, politely ask for clarification."
)


class TravelAgentSystem:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY is not set in ai-service/.env")
        self.client = genai.Client(api_key=api_key)
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.buffer = []
        self.summary = ""
        self.max_buffer = 5

    def _json_config(self):
        return types.GenerateContentConfig(
            response_mime_type="application/json",
            system_instruction=SYSTEM_INSTRUCTION,
        )

    def _generate(self, prompt: str) -> str:
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=self._json_config(),
        )
        return response.text

    def generate_plan(self, dest, interests, total_budget, num_days):
        prompt = f"""
        Create a {num_days}-day travel itinerary for {dest}.
        Interests: {interests or "general sightseeing"}
        Total budget limit: {total_budget}

        Rules:
        - Stay strictly under the budget
        - daily_total must equal sum of that day's activity costs
        - grand_total_estimated_cost must equal sum of all daily_total values
        - 2-4 activities per day with realistic times; short descriptions
        - Use specific venue/place names where possible

        Return ONLY valid JSON with this structure:
        {{
          "destination": "{dest}",
          "total_budget_limit": {total_budget},
          "budget_optimization_notes": "brief string",
          "itinerary": [
            {{
              "day": 1,
              "daily_total": 0,
              "activities": [
                {{
                  "time": "09:00",
                  "activity_name": "Name",
                  "estimated_cost": 0,
                  "description": "One sentence."
                }}
              ]
            }}
          ],
          "grand_total_estimated_cost": 0
        }}
        """
        try:
            return json.loads(self._generate(prompt))
        except json.JSONDecodeError as e:
            raise ValueError(f"AI returned invalid JSON: {e}") from e

    def revise_itinerary(self, itinerary_dict, feedback):
        itinerary_json_str = json.dumps(itinerary_dict, indent=2)
        revision_prompt = f"""
        You are revising an existing travel itinerary.

        RULES:
        - Return ONLY a valid json object
        - Do NOT ask follow-up questions
        - If a user dislikes an activity, REPLACE it with a new one that fits their interests
        - Do NOT simply delete activities; maintain a full schedule for each day
        - Always return a COMPLETE revised itinerary
        - Maintain the same json format as input
        - Recalculate costs and keep total under the original budget

        CONTEXT:
        Long-term preferences summary: {self.summary}
        Recent user feedback: {", ".join(self.buffer)}

        Current Itinerary:
        {itinerary_json_str}

        User Feedback:
        {feedback}

        Return the fully updated itinerary.
        """
        text = self._generate(revision_prompt)
        self.buffer.append(feedback)
        if len(self.buffer) >= self.max_buffer:
            self._summarize_conversation()
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            raise ValueError(f"AI returned invalid JSON: {e}") from e

    def _summarize_conversation(self):
        to_summarize = self.buffer[:-2]
        self.buffer = self.buffer[-2:]
        history_text = "\n".join(to_summarize)
        summary_prompt = f"""
        Update this travel-planning memory in 2-3 concise sentences.
        Preserve destination, budget, and explicit user preferences only.

        Old Summary: {self.summary}
        Recent Feedback: {history_text}
        New Updated Summary:
        """
        plain_config = types.GenerateContentConfig(system_instruction=SYSTEM_INSTRUCTION)
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=summary_prompt,
            config=plain_config,
        )
        self.summary = response.text
