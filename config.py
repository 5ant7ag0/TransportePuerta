import os

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'puerta-a-puerta-secret-key-2026'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Pricing
    PRECIO_POR_KM = 5.0   # $5 por kilómetro
    PRECIO_POR_KG = 3.0   # $3 por kilogramo

    # Contact info
    WHATSAPP_NUMBER = '593999999999'
    TELEFONO = '+593 99 999 9999'
    EMAIL = 'info@puertaapuerta.ec'
    DIRECCION = 'Av. Principal S/N, Quito, Ecuador'

    # Social media
    FACEBOOK = 'https://facebook.com/puertaapuerta'
    INSTAGRAM = 'https://instagram.com/puertaapuerta'
    TIKTOK = 'https://tiktok.com/@puertaapuerta'
