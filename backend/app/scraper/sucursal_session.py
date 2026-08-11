from typing import Dict, Any

# Mapeo de datos de ubicación/sucursal para La Anónima (Chubut y Patagonia)
SUCURSALES_DATA: Dict[str, Dict[str, Any]] = {
    "TRELEW_01": {
        "codigo": "TRELEW_01",
        "nombre": "Trelew",
        "provincia": "Chubut",
        "zip_code": "9120",
        "store_id": "101",
        "cookies": {
            "LA_SUCURSAL": "TRELEW_CENTRO",
            "la_anonima_zip": "9120",
            "store_code": "101",
            "provincia": "Chubut"
        }
    },
    "RAWSON_01": {
        "codigo": "RAWSON_01",
        "nombre": "Rawson",
        "provincia": "Chubut",
        "zip_code": "9103",
        "store_id": "102",
        "cookies": {
            "LA_SUCURSAL": "RAWSON_CENTRO",
            "la_anonima_zip": "9103",
            "store_code": "102",
            "provincia": "Chubut"
        }
    },
    "MADRYN_01": {
        "codigo": "MADRYN_01",
        "nombre": "Puerto Madryn",
        "provincia": "Chubut",
        "zip_code": "9120",
        "store_id": "103",
        "cookies": {
            "LA_SUCURSAL": "PUERTO_MADRYN_01",
            "la_anonima_zip": "9120",
            "store_code": "103",
            "provincia": "Chubut"
        }
    },
    "COMODORO_01": {
        "codigo": "COMODORO_01",
        "nombre": "Comodoro Rivadavia",
        "provincia": "Chubut",
        "zip_code": "9000",
        "store_id": "104",
        "cookies": {
            "LA_SUCURSAL": "COMODORO_RIVADAVIA",
            "la_anonima_zip": "9000",
            "store_code": "104",
            "provincia": "Chubut"
        }
    },
    "ESQUEL_01": {
        "codigo": "ESQUEL_01",
        "nombre": "Esquel",
        "provincia": "Chubut",
        "zip_code": "9200",
        "store_id": "105",
        "cookies": {
            "LA_SUCURSAL": "ESQUEL_CENTRO",
            "la_anonima_zip": "9200",
            "store_code": "105",
            "provincia": "Chubut"
        }
    }
}

def get_sucursal_session_config(sucursal_query: str) -> Dict[str, Any]:
    """
    Busca los datos de sesión/cookies para una sucursal dada por nombre o código.
    """
    query_upper = sucursal_query.strip().upper()
    
    # Buscar por código directo
    if query_upper in SUCURSALES_DATA:
        return SUCURSALES_DATA[query_upper]
    
    # Buscar por coincidencia parcial de nombre
    for key, data in SUCURSALES_DATA.items():
        if data["nombre"].upper() in query_upper or query_upper in data["nombre"].upper():
            return data
            
    # Default fallback a Trelew si no coincide
    return SUCURSALES_DATA["TRELEW_01"]
