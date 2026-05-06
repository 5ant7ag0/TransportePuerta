from datetime import datetime
import random
import string
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


def generar_tracking():
    """Genera un código de rastreo único."""
    prefix = 'PAP'
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f'{prefix}-{code}'


class Usuario(UserMixin, db.Model):
    __tablename__ = 'usuarios'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    telefono = db.Column(db.String(20))
    password_hash = db.Column(db.String(256), nullable=False)
    es_admin = db.Column(db.Boolean, default=False)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)

    pedidos = db.relationship('Pedido', backref='cliente', lazy=True)
    reservas = db.relationship('Reserva', backref='cliente', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Pedido(db.Model):
    __tablename__ = 'pedidos'

    id = db.Column(db.Integer, primary_key=True)
    tracking_code = db.Column(db.String(20), unique=True, default=generar_tracking)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=True)

    # Origen y destino
    origen = db.Column(db.String(200), nullable=False)
    destino = db.Column(db.String(200), nullable=False)

    # Detalles del paquete
    descripcion = db.Column(db.Text)
    peso_kg = db.Column(db.Float, default=0)
    distancia_km = db.Column(db.Float, default=0)

    # Tipo de servicio
    tipo_servicio = db.Column(db.String(50), nullable=False)

    # Precio y estado
    precio_total = db.Column(db.Float, default=0)
    estado = db.Column(db.String(30), default='Pendiente')
    # Estados: Pendiente, Recogido, En tránsito, En destino, Entregado, Cancelado

    # Contacto del remitente
    nombre_remitente = db.Column(db.String(100))
    telefono_remitente = db.Column(db.String(20))

    # Contacto del destinatario
    nombre_destinatario = db.Column(db.String(100))
    telefono_destinatario = db.Column(db.String(20))

    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'tracking_code': self.tracking_code,
            'usuario_id': self.usuario_id,
            'origen': self.origen,
            'destino': self.destino,
            'descripcion': self.descripcion,
            'peso_kg': self.peso_kg,
            'distancia_km': self.distancia_km,
            'tipo_servicio': self.tipo_servicio,
            'precio_total': self.precio_total,
            'estado': self.estado,
            'nombre_remitente': self.nombre_remitente,
            'telefono_remitente': self.telefono_remitente,
            'nombre_destinatario': self.nombre_destinatario,
            'telefono_destinatario': self.telefono_destinatario,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'fecha_actualizacion': self.fecha_actualizacion.isoformat() if self.fecha_actualizacion else None
        }


class Reserva(db.Model):
    __tablename__ = 'reservas'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=True)

    tipo_servicio = db.Column(db.String(50), nullable=False)
    fecha_servicio = db.Column(db.DateTime, nullable=False)
    origen = db.Column(db.String(200), nullable=False)
    destino = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text)

    nombre_cliente = db.Column(db.String(100), nullable=False)
    telefono_cliente = db.Column(db.String(20), nullable=False)
    email_cliente = db.Column(db.String(120))

    estado = db.Column(db.String(30), default='Pendiente')
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)


class Contacto(db.Model):
    __tablename__ = 'contactos'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    telefono = db.Column(db.String(20))
    asunto = db.Column(db.String(200))
    mensaje = db.Column(db.Text, nullable=False)
    leido = db.Column(db.Boolean, default=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)


class Cotizacion(db.Model):
    __tablename__ = 'cotizaciones'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))
    email = db.Column(db.String(120))
    telefono = db.Column(db.String(20))
    origen = db.Column(db.String(200))
    destino = db.Column(db.String(200))
    tipo_servicio = db.Column(db.String(50))
    distancia_km = db.Column(db.Float, default=0)
    peso_kg = db.Column(db.Float, default=0)
    precio_estimado = db.Column(db.Float, default=0)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
