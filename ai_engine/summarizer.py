# ai_engine/summarizer.py

def generate_summary(incident_type, state, country):

    if incident_type == "cyber_attack":
        return f"Cyber related activity detected in {state or country}."

    if incident_type == "border_tension":
        return f"Border tension activity reported near {state or country}."

    if incident_type == "military_activity":
        return f"Increased military presence observed in {state or country}."

    if incident_type == "civil_unrest":
        return f"Civil unrest signals emerging in {state or country}."

    return f"General activity detected in {state or country}."
