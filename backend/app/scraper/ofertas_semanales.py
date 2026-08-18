"""
Oferta Semanal Yaguar — 12 productos curados con precios de bulto cerrado.
Cada producto tiene: sku, titulo, descripcion, unidades por bulto,
precio_bulto (None si se calcula por descuento) y descuento_pct.
"""

YAGUAR_OFERTA_SEMANAL = [
    {
        "sku": "2313",
        "titulo": "MAYONESA NATURA SACHET 125GR",
        "descripcion": "Sachet x 125 grs",
        "unidades": 20,
        "precio_bulto": 10300,
        "descuento_pct": None,
    },
    {
        "sku": "128",
        "titulo": "ACEITE COCINERO GIRASOL 900CC",
        "descripcion": "Girasol x 900 cc",
        "unidades": 15,
        "precio_bulto": 44985,
        "descuento_pct": None,
    },
    {
        "sku": "77839",
        "titulo": "YERBA ROSAMONTE TRADICIONAL 55 ANIVERSARIO 500GR",
        "descripcion": "Tradicional 55 Aniversario x 500 grs",
        "unidades": 10,
        "precio_bulto": 14990,
        "descuento_pct": None,
    },
    {
        "sku": "80292",
        "titulo": "ALIMENTO A BASE DE CAFE ARLISTAN INSTANTANEO SUSTENTABLE 170GR",
        "descripcion": "Instantáneo x 170 grs",
        "unidades": 12,
        "precio_bulto": 69588,
        "descuento_pct": None,
    },
    {
        "sku": "6925",
        "titulo": "CHOCOLATE HAMLET BICOLOR 42GR",
        "descripcion": "x 45 grs",
        "unidades": 21,
        "precio_bulto": 14889,
        "descuento_pct": None,
    },
    {
        "sku": "11026",
        "titulo": "GALLETITAS BIZCOCHOS 9 DE ORO CLASICOS 200GR",
        "descripcion": "x 200 grs",
        "unidades": 20,
        "precio_bulto": 19180,
        "descuento_pct": None,
    },
    {
        "sku": "1691",
        "titulo": "ALIMENTO BAGGIO PRONTO NARANJA 1LT",
        "descripcion": "x 200 cc",
        "unidades": 18,
        "precio_bulto": 10962,
        "descuento_pct": None,
    },
    {
        "sku": "75703",
        "titulo": "VODKA SERNOVA WILD BERRIES 750CC",
        "descripcion": "Sabores x 750 cc",
        "unidades": 6,
        "precio_bulto": None,
        "descuento_pct": 25,
    },
    {
        "sku": "79984",
        "titulo": "MAQUINA DE AFEITAR MINORA II PRO",
        "descripcion": "II Pro",
        "unidades": 20,
        "precio_bulto": 14580,
        "descuento_pct": None,
    },
    {
        "sku": "81081",
        "titulo": "JABON DE TOCADOR LUX ORQUIDEA NEGRA 125GR",
        "descripcion": "x 120 grs",
        "unidades": 72,
        "precio_bulto": 79128,
        "descuento_pct": None,
    },
    {
        "sku": "77943",
        "titulo": "LUSTRAMUEBLES BLEM ORIGINAL 360ML",
        "descripcion": "x 360 cc",
        "unidades": 12,
        "precio_bulto": 50268,
        "descuento_pct": None,
    },
    {
        "sku": "78772",
        "titulo": "DESINFECTANTE LYSOFORM AIRE DE MONTAÑA 360ML",
        "descripcion": "x 360 cc",
        "unidades": 12,
        "precio_bulto": 39468,
        "descuento_pct": None,
    },
]

YAGUAR_OFERTA_SEMANAL_SKUS = [item["sku"] for item in YAGUAR_OFERTA_SEMANAL]
