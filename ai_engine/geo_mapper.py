# ai_engine/geo_mapper.py

INDIAN_STATES = [
    "Jammu", "Kashmir", "Punjab", "Rajasthan",
    "Gujarat", "Assam", "Arunachal Pradesh",
    "Nagaland", "Manipur", "Uttarakhand",
    "Himachal Pradesh", "Ladakh"
]

NEIGHBOR_COUNTRIES = [
    "Pakistan", "China", "Bangladesh", "Nepal", "Sri Lanka"
]


def detect_country(locations):

    for loc in locations:
        for country in NEIGHBOR_COUNTRIES:
            if country.lower() in loc.lower():
                return country

    return "India"


def detect_state(locations):

    for loc in locations:
        for state in INDIAN_STATES:
            if state.lower() in loc.lower():
                return state

    return None
