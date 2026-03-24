import csv
import json
from collections import defaultdict
from pathlib import Path


AOR_COORDINATES = {
    "Atlanta": {"lat": 33.7490, "lng": -84.3880},
    "Baltimore": {"lat": 39.2904, "lng": -76.6122},
    "Boston": {"lat": 42.3601, "lng": -71.0589},
    "Buffalo": {"lat": 42.8864, "lng": -78.8784},
    "Chicago": {"lat": 41.8781, "lng": -87.6298},
    "Dallas": {"lat": 32.7767, "lng": -96.7970},
    "Denver": {"lat": 39.7392, "lng": -104.9903},
    "Detroit": {"lat": 42.3314, "lng": -83.0458},
    "El Paso": {"lat": 31.7619, "lng": -106.4850},
    "HQ": {"lat": 38.9072, "lng": -77.0369},
    "Harlingen": {"lat": 26.1906, "lng": -97.6961},
    "Houston": {"lat": 29.7604, "lng": -95.3698},
    "Los Angeles": {"lat": 34.0522, "lng": -118.2437},
    "Miami": {"lat": 25.7617, "lng": -80.1918},
    "New Orleans": {"lat": 29.9511, "lng": -90.0715},
    "New York City": {"lat": 40.7128, "lng": -74.0060},
    "Newark": {"lat": 40.7357, "lng": -74.1724},
    "Philadelphia": {"lat": 39.9526, "lng": -75.1652},
    "Phoenix": {"lat": 33.4484, "lng": -112.0740},
    "Salt Lake City": {"lat": 40.7608, "lng": -111.8910},
    "San Antonio": {"lat": 29.4241, "lng": -98.4936},
    "San Diego": {"lat": 32.7157, "lng": -117.1611},
    "San Francisco": {"lat": 37.7749, "lng": -122.4194},
    "Seattle": {"lat": 47.6062, "lng": -122.3321},
    "St. Paul": {"lat": 44.9537, "lng": -93.0900},
    "Unmapped AOR Records": {"lat": 39.8283, "lng": -98.5795},
    "Washington": {"lat": 38.9072, "lng": -77.0369},
}


COUNTRY_CODES = {
    "AFGHANISTAN": {"iso3": "AFG", "iso_numeric": "004"},
    "ALBANIA": {"iso3": "ALB", "iso_numeric": "008"},
    "ANGOLA": {"iso3": "AGO", "iso_numeric": "024"},
    "ARGENTINA": {"iso3": "ARG", "iso_numeric": "032"},
    "ARMENIA": {"iso3": "ARM", "iso_numeric": "051"},
    "AZERBAIJAN": {"iso3": "AZE", "iso_numeric": "031"},
    "BAHAMAS": {"iso3": "BHS", "iso_numeric": "044"},
    "BANGLADESH": {"iso3": "BGD", "iso_numeric": "050"},
    "BELARUS": {"iso3": "BLR", "iso_numeric": "112"},
    "BELIZE": {"iso3": "BLZ", "iso_numeric": "084"},
    "BENIN": {"iso3": "BEN", "iso_numeric": "204"},
    "BOLIVIA": {"iso3": "BOL", "iso_numeric": "068"},
    "BRAZIL": {"iso3": "BRA", "iso_numeric": "076"},
    "BURKINA FASO": {"iso3": "BFA", "iso_numeric": "854"},
    "CAMEROON": {"iso3": "CMR", "iso_numeric": "120"},
    "CANADA": {"iso3": "CAN", "iso_numeric": "124"},
    "CHAD": {"iso3": "TCD", "iso_numeric": "148"},
    "CHILE": {"iso3": "CHL", "iso_numeric": "152"},
    "CHINA, PEOPLES REPUBLIC OF": {"iso3": "CHN", "iso_numeric": "156"},
    "COLOMBIA": {"iso3": "COL", "iso_numeric": "170"},
    "CONGO": {"iso3": "COG", "iso_numeric": "178"},
    "COSTA RICA": {"iso3": "CRI", "iso_numeric": "188"},
    "CUBA": {"iso3": "CUB", "iso_numeric": "192"},
    "DEM REP OF THE CONGO": {"iso3": "COD", "iso_numeric": "180"},
    "DOMINICAN REPUBLIC": {"iso3": "DOM", "iso_numeric": "214"},
    "ECUADOR": {"iso3": "ECU", "iso_numeric": "218"},
    "EGYPT": {"iso3": "EGY", "iso_numeric": "818"},
    "EL SALVADOR": {"iso3": "SLV", "iso_numeric": "222"},
    "ERITREA": {"iso3": "ERI", "iso_numeric": "232"},
    "ETHIOPIA": {"iso3": "ETH", "iso_numeric": "231"},
    "FRANCE": {"iso3": "FRA", "iso_numeric": "250"},
    "GAMBIA": {"iso3": "GMB", "iso_numeric": "270"},
    "GEORGIA": {"iso3": "GEO", "iso_numeric": "268"},
    "GERMANY": {"iso3": "DEU", "iso_numeric": "276"},
    "GHANA": {"iso3": "GHA", "iso_numeric": "288"},
    "GUATEMALA": {"iso3": "GTM", "iso_numeric": "320"},
    "GUINEA": {"iso3": "GIN", "iso_numeric": "324"},
    "HAITI": {"iso3": "HTI", "iso_numeric": "332"},
    "HONDURAS": {"iso3": "HND", "iso_numeric": "340"},
    "INDIA": {"iso3": "IND", "iso_numeric": "356"},
    "INDONESIA": {"iso3": "IDN", "iso_numeric": "360"},
    "IRAN": {"iso3": "IRN", "iso_numeric": "364"},
    "ITALY": {"iso3": "ITA", "iso_numeric": "380"},
    "JAMAICA": {"iso3": "JAM", "iso_numeric": "388"},
    "JORDAN": {"iso3": "JOR", "iso_numeric": "400"},
    "KAZAKHSTAN": {"iso3": "KAZ", "iso_numeric": "398"},
    "KOSOVO": {"iso3": "XKX", "iso_numeric": "383"},
    "KYRGYZSTAN": {"iso3": "KGZ", "iso_numeric": "417"},
    "MALI": {"iso3": "MLI", "iso_numeric": "466"},
    "MARSHALL ISLANDS": {"iso3": "MHL", "iso_numeric": "584"},
    "MAURITANIA": {"iso3": "MRT", "iso_numeric": "478"},
    "MEXICO": {"iso3": "MEX", "iso_numeric": "484"},
    "MICRONESIA, FEDERATED STATES OF": {"iso3": "FSM", "iso_numeric": "583"},
    "MOROCCO": {"iso3": "MAR", "iso_numeric": "504"},
    "NEPAL": {"iso3": "NPL", "iso_numeric": "524"},
    "NICARAGUA": {"iso3": "NIC", "iso_numeric": "558"},
    "NIGER": {"iso3": "NER", "iso_numeric": "562"},
    "NIGERIA": {"iso3": "NGA", "iso_numeric": "566"},
    "PAKISTAN": {"iso3": "PAK", "iso_numeric": "586"},
    "PANAMA": {"iso3": "PAN", "iso_numeric": "591"},
    "PARAGUAY": {"iso3": "PRY", "iso_numeric": "600"},
    "PERU": {"iso3": "PER", "iso_numeric": "604"},
    "PHILIPPINES": {"iso3": "PHL", "iso_numeric": "608"},
    "REPUBLIC OF TURKIYE": {"iso3": "TUR", "iso_numeric": "792"},
    "ROMANIA": {"iso3": "ROU", "iso_numeric": "642"},
    "RUSSIA": {"iso3": "RUS", "iso_numeric": "643"},
    "SENEGAL": {"iso3": "SEN", "iso_numeric": "686"},
    "SIERRA LEONE": {"iso3": "SLE", "iso_numeric": "694"},
    "SOMALIA": {"iso3": "SOM", "iso_numeric": "706"},
    "SOUTH KOREA": {"iso3": "KOR", "iso_numeric": "410"},
    "SPAIN": {"iso3": "ESP", "iso_numeric": "724"},
    "SRI LANKA": {"iso3": "LKA", "iso_numeric": "144"},
    "SUDAN": {"iso3": "SDN", "iso_numeric": "729"},
    "SYRIA": {"iso3": "SYR", "iso_numeric": "760"},
    "TAIWAN": {"iso3": "TWN", "iso_numeric": "158"},
    "TAJIKISTAN": {"iso3": "TJK", "iso_numeric": "762"},
    "TOGO": {"iso3": "TGO", "iso_numeric": "768"},
    "TURKIYE": {"iso3": "TUR", "iso_numeric": "792"},
    "UKRAINE": {"iso3": "UKR", "iso_numeric": "804"},
    "UNITED KINGDOM": {"iso3": "GBR", "iso_numeric": "826"},
    "URUGUAY": {"iso3": "URY", "iso_numeric": "858"},
    "UZBEKISTAN": {"iso3": "UZB", "iso_numeric": "860"},
    "VENEZUELA": {"iso3": "VEN", "iso_numeric": "862"},
    "VIETNAM": {"iso3": "VNM", "iso_numeric": "704"},
    "YEMEN": {"iso3": "YEM", "iso_numeric": "887"},
}


def parse_int(value):
    if value is None or value == "":
        return 0
    return int(float(value))


def normalize_country_name(country):
    cleaned = (country or "").strip().upper()
    cleaned = cleaned.replace("T\uFFFDRKIYE", "TURKIYE")
    cleaned = cleaned.replace("T\u00dcRKIYE", "TURKIYE")
    cleaned = cleaned.replace("REPUBLIC OF TÜRKIYE", "REPUBLIC OF TURKIYE")
    return cleaned


def read_combined_rows(csv_path):
    with csv_path.open("r", encoding="utf-8-sig", errors="replace", newline="") as f:
        reader = csv.DictReader(f)
        return list(reader)


def build_aor_records(rows):
    grouped = defaultdict(lambda: {"detentions": 0, "removals": 0, "arrests": 0})
    country_breakdown = defaultdict(lambda: defaultdict(int))
    years = set()

    for row in rows:
        aor = row["Area of Responsibility (AOR)"]
        fiscal_year = int(row["Fiscal Year"])
        country = normalize_country_name(row["Country of Citizenship"])
        detentions = parse_int(row["Detentions"])
        removals = parse_int(row["Removals"])
        arrests = parse_int(row["Administrative Arrests"])
        total = detentions + removals + arrests

        years.add(fiscal_year)
        key = (aor, fiscal_year)
        grouped[key]["detentions"] += detentions
        grouped[key]["removals"] += removals
        grouped[key]["arrests"] += arrests
        country_breakdown[key][country] += total

    records = []
    for (aor, fiscal_year), metrics in sorted(grouped.items(), key=lambda x: (x[0][1], x[0][0])):
        coords = AOR_COORDINATES.get(aor, {"lat": 39.8283, "lng": -98.5795})
        total = metrics["detentions"] + metrics["removals"] + metrics["arrests"]
        top_countries = sorted(country_breakdown[(aor, fiscal_year)].items(), key=lambda x: x[1], reverse=True)[:3]
        records.append(
            {
                "aor": aor,
                "fiscal_year": fiscal_year,
                "lat": coords["lat"],
                "lng": coords["lng"],
                "detentions": metrics["detentions"],
                "removals": metrics["removals"],
                "arrests": metrics["arrests"],
                "total": total,
                "top_countries": [{"country": c, "total": v} for c, v in top_countries],
            }
        )

    return {"years": sorted(years), "records": records}


def build_country_records(rows):
    grouped = defaultdict(lambda: {"detentions": 0, "removals": 0, "arrests": 0})
    years = set()

    for row in rows:
        country_raw = row["Country of Citizenship"]
        country = normalize_country_name(country_raw)
        fiscal_year = int(row["Fiscal Year"])
        detentions = parse_int(row["Detentions"])
        removals = parse_int(row["Removals"])
        arrests = parse_int(row["Administrative Arrests"])

        years.add(fiscal_year)
        key = (country, country_raw, fiscal_year)
        grouped[key]["detentions"] += detentions
        grouped[key]["removals"] += removals
        grouped[key]["arrests"] += arrests

    records = []
    for (country_norm, country_display, fiscal_year), metrics in sorted(grouped.items(), key=lambda x: (x[0][2], x[0][0])):
        codes = COUNTRY_CODES.get(country_norm, {"iso3": None, "iso_numeric": None})
        total = metrics["detentions"] + metrics["removals"] + metrics["arrests"]
        records.append(
            {
                "country": country_display,
                "country_normalized": country_norm,
                "fiscal_year": fiscal_year,
                "iso3": codes["iso3"],
                "iso_numeric": codes["iso_numeric"],
                "detentions": metrics["detentions"],
                "removals": metrics["removals"],
                "arrests": metrics["arrests"],
                "total": total,
            }
        )

    return {"years": sorted(years), "records": records}


def build_country_yearly(country_payload):
    records = country_payload["records"]
    overall = defaultdict(int)
    yearly = defaultdict(lambda: defaultdict(lambda: {"detentions": 0, "removals": 0, "arrests": 0}))

    for row in records:
        country = row["country_normalized"]
        year = row["fiscal_year"]
        if country == "UNKNOWN":
            continue

        overall[country] += row["total"]
        yearly[country][year]["detentions"] += row["detentions"]
        yearly[country][year]["removals"] += row["removals"]
        yearly[country][year]["arrests"] += row["arrests"]

    top_countries = [name for name, _ in sorted(overall.items(), key=lambda x: x[1], reverse=True)[:10]]
    years = sorted(country_payload["years"])
    stream_records = []

    for country in top_countries:
        codes = COUNTRY_CODES.get(country, {"iso3": None, "iso_numeric": None})
        for fiscal_year in years:
            metrics = yearly[country][fiscal_year]
            total = metrics["detentions"] + metrics["removals"] + metrics["arrests"]
            stream_records.append(
                {
                    "country": country,
                    "fiscal_year": fiscal_year,
                    "iso3": codes["iso3"],
                    "iso_numeric": codes["iso_numeric"],
                    "detentions": metrics["detentions"],
                    "removals": metrics["removals"],
                    "arrests": metrics["arrests"],
                    "total": total,
                }
            )

    return {"years": years, "top_countries": top_countries, "records": stream_records}


def write_json(path, payload):
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)


def main():
    repo_root = Path(__file__).resolve().parent
    data_dir = repo_root / "data"
    data_dir.mkdir(parents=True, exist_ok=True)

    combined_csv = repo_root.parent / "combined_ice_data.csv"
    if not combined_csv.exists():
        raise FileNotFoundError(
            f"Could not find {combined_csv}. Place combined_ice_data.csv next to info-vis-project folder."
        )

    rows = read_combined_rows(combined_csv)
    aor_payload = build_aor_records(rows)
    country_payload = build_country_records(rows)
    stream_payload = build_country_yearly(country_payload)

    write_json(data_dir / "aor_data.json", aor_payload)
    write_json(data_dir / "country_data.json", country_payload)
    write_json(data_dir / "country_yearly.json", stream_payload)

    missing_iso = sorted(
        {
            r["country_normalized"]
            for r in country_payload["records"]
            if r["iso3"] is None and r["country_normalized"] != "UNKNOWN"
        }
    )

    print("Wrote data/aor_data.json")
    print("Wrote data/country_data.json")
    print("Wrote data/country_yearly.json")
    if missing_iso:
        print("Warning: Missing ISO mapping for:", ", ".join(missing_iso))


if __name__ == "__main__":
    main()
