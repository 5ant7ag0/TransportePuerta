from datetime import datetime
from functools import wraps

from flask import Flask, render_template, redirect, url_for, flash, request, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_cors import CORS

from config import Config
from models import db, Usuario, Pedido, Reserva, Contacto, Cotizacion

app = Flask(__name__)
CORS(app)
app.config.from_object(Config)

db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Por favor inicia sesión para acceder a esta página.'
login_manager.login_message_category = 'warning'


@login_manager.user_loader
def load_user(user_id):
    return Usuario.query.get(int(user_id))


def admin_required(f):
    """Decorador para rutas que requieren permisos de administrador."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.es_admin:
            flash('No tienes permisos para acceder a esta página.', 'danger')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function


# ========================
# CONTEXTO GLOBAL
# ========================
@app.context_processor
def inject_config():
    return {
        'whatsapp': app.config['WHATSAPP_NUMBER'],
        'telefono': app.config['TELEFONO'],
        'email_contacto': app.config['EMAIL'],
        'direccion': app.config['DIRECCION'],
        'facebook': app.config['FACEBOOK'],
        'instagram': app.config['INSTAGRAM'],
        'tiktok': app.config['TIKTOK'],
        'precio_km': app.config['PRECIO_POR_KM'],
        'precio_kg': app.config['PRECIO_POR_KG'],
        'year': datetime.utcnow().year,
    }


# ========================
# RUTAS PÚBLICAS
# ========================
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/servicios')
def servicios():
    return render_template('servicios.html')


@app.route('/cobertura')
def cobertura():
    return render_template('cobertura.html')


@app.route('/cotizacion', methods=['GET', 'POST'])
def cotizacion():
    if request.method == 'POST':
        distancia = float(request.form.get('distancia', 0))
        peso = float(request.form.get('peso', 0))
        tipo = request.form.get('tipo_servicio', 'paqueteria')

        precio_distancia = distancia * app.config['PRECIO_POR_KM']
        precio_peso = peso * app.config['PRECIO_POR_KG']
        precio_total = precio_distancia + precio_peso

        # Ajustes por tipo de servicio
        multiplicadores = {
            'paqueteria': 1.0,
            'mudanza': 1.5,
            'personas': 0.8,
            'express': 2.0,
            'carga_pesada': 1.8,
            'delivery': 1.2,
        }
        multiplicador = multiplicadores.get(tipo, 1.0)
        precio_total *= multiplicador

        # Guardar cotización
        nueva_cotizacion = Cotizacion(
            nombre=request.form.get('nombre', ''),
            email=request.form.get('email', ''),
            telefono=request.form.get('telefono', ''),
            origen=request.form.get('origen', ''),
            destino=request.form.get('destino', ''),
            tipo_servicio=tipo,
            distancia_km=distancia,
            peso_kg=peso,
            precio_estimado=round(precio_total, 2)
        )
        db.session.add(nueva_cotizacion)
        db.session.commit()

        return render_template('cotizacion.html', precio=round(precio_total, 2),
                               distancia=distancia, peso=peso, tipo=tipo)

    return render_template('cotizacion.html')


@app.route('/api/cotizar', methods=['POST'])
def api_cotizar():
    """API endpoint para cotización en tiempo real."""
    data = request.get_json()
    distancia = float(data.get('distancia', 0))
    peso = float(data.get('peso', 0))
    tipo = data.get('tipo_servicio', 'paqueteria')

    precio_distancia = distancia * app.config['PRECIO_POR_KM']
    precio_peso = peso * app.config['PRECIO_POR_KG']
    precio_total = precio_distancia + precio_peso

    multiplicadores = {
        'paqueteria': 1.0,
        'mudanza': 1.5,
        'personas': 0.8,
        'express': 2.0,
        'carga_pesada': 1.8,
        'delivery': 1.2,
    }
    multiplicador = multiplicadores.get(tipo, 1.0)
    precio_total *= multiplicador

    return jsonify({
        'precio_distancia': round(precio_distancia, 2),
        'precio_peso': round(precio_peso, 2),
        'multiplicador': multiplicador,
        'precio_total': round(precio_total, 2),
    })


@app.route('/api/pedidos', methods=['GET', 'POST'])
def api_pedidos():
    """API endpoint para listar y crear pedidos."""
    if request.method == 'POST':
        data = request.get_json()
        
        distancia = float(data.get('distancia_km', 0))
        peso = float(data.get('peso_kg', 0))
        tipo = data.get('tipo_servicio', 'paqueteria')

        precio_distancia = distancia * app.config['PRECIO_POR_KM']
        precio_peso = peso * app.config['PRECIO_POR_KG']
        precio_total = precio_distancia + precio_peso

        multiplicadores = {
            'paqueteria': 1.0, 'mudanza': 1.5, 'personas': 0.8,
            'express': 2.0, 'carga_pesada': 1.8, 'delivery': 1.2,
        }
        precio_total *= multiplicadores.get(tipo, 1.0)

        nuevo_pedido = Pedido(
            origen=data.get('origen'),
            destino=data.get('destino'),
            descripcion=data.get('descripcion', ''),
            peso_kg=peso,
            distancia_km=distancia,
            tipo_servicio=tipo,
            precio_total=round(precio_total, 2),
            nombre_remitente=data.get('nombre_remitente', ''),
            telefono_remitente=data.get('telefono_remitente', ''),
            nombre_destinatario=data.get('nombre_destinatario', ''),
            telefono_destinatario=data.get('telefono_destinatario', ''),
            estado='Pendiente'
        )
        db.session.add(nuevo_pedido)
        db.session.commit()
        return jsonify(nuevo_pedido.to_dict()), 201

    pedidos = Pedido.query.order_by(Pedido.fecha_creacion.desc()).all()
    return jsonify([pedido.to_dict() for pedido in pedidos])


@app.route('/api/rastreo/<string:tracking_code>', methods=['GET'])
def api_rastreo(tracking_code):
    """API endpoint para rastrear un pedido por su código."""
    pedido = Pedido.query.filter_by(tracking_code=tracking_code.upper()).first()
    if not pedido:
        return jsonify({'error': 'Pedido no encontrado'}), 404
    return jsonify(pedido.to_dict()), 200


@app.route('/contacto', methods=['GET', 'POST'])
def contacto():
    if request.method == 'POST':
        nuevo_contacto = Contacto(
            nombre=request.form['nombre'],
            email=request.form['email'],
            telefono=request.form.get('telefono', ''),
            asunto=request.form.get('asunto', ''),
            mensaje=request.form['mensaje']
        )
        db.session.add(nuevo_contacto)
        db.session.commit()
        flash('¡Mensaje enviado exitosamente! Te contactaremos pronto.', 'success')
        return redirect(url_for('contacto'))
    return render_template('contacto.html')


@app.route('/rastreo', methods=['GET', 'POST'])
def rastreo():
    pedido = None
    if request.method == 'POST':
        codigo = request.form.get('tracking_code', '').strip().upper()
        pedido = Pedido.query.filter_by(tracking_code=codigo).first()
        if not pedido:
            flash('No se encontró ningún pedido con ese código de rastreo.', 'danger')
    return render_template('rastreo.html', pedido=pedido)


@app.route('/reservar', methods=['GET', 'POST'])
def reservar():
    if request.method == 'POST':
        nueva_reserva = Reserva(
            usuario_id=current_user.id if current_user.is_authenticated else None,
            tipo_servicio=request.form['tipo_servicio'],
            fecha_servicio=datetime.strptime(request.form['fecha_servicio'], '%Y-%m-%dT%H:%M'),
            origen=request.form['origen'],
            destino=request.form['destino'],
            descripcion=request.form.get('descripcion', ''),
            nombre_cliente=request.form['nombre'],
            telefono_cliente=request.form['telefono'],
            email_cliente=request.form.get('email', ''),
        )
        db.session.add(nueva_reserva)
        db.session.commit()
        flash('¡Reserva realizada con éxito! Te contactaremos para confirmar los detalles.', 'success')
        return redirect(url_for('reservar'))
    return render_template('reservar.html')


@app.route('/nosotros')
def nosotros():
    return render_template('nosotros.html')


# ========================
# AUTENTICACIÓN
# ========================
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        if current_user.es_admin:
            return redirect(url_for('admin_dashboard'))
        return redirect(url_for('cliente_dashboard'))

    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = Usuario.query.filter_by(email=email).first()

        if user and user.check_password(password):
            login_user(user)
            flash('¡Bienvenido de vuelta!', 'success')
            next_page = request.args.get('next')
            if next_page:
                return redirect(next_page)
            if user.es_admin:
                return redirect(url_for('admin_dashboard'))
            return redirect(url_for('cliente_dashboard'))
        else:
            flash('Email o contraseña incorrectos.', 'danger')

    return render_template('login.html')


@app.route('/registro', methods=['GET', 'POST'])
def registro():
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    if request.method == 'POST':
        nombre = request.form['nombre']
        email = request.form['email']
        telefono = request.form.get('telefono', '')
        password = request.form['password']
        confirm = request.form['confirm_password']

        if password != confirm:
            flash('Las contraseñas no coinciden.', 'danger')
            return redirect(url_for('registro'))

        if Usuario.query.filter_by(email=email).first():
            flash('Ya existe una cuenta con ese email.', 'danger')
            return redirect(url_for('registro'))

        nuevo_usuario = Usuario(nombre=nombre, email=email, telefono=telefono)
        nuevo_usuario.set_password(password)
        db.session.add(nuevo_usuario)
        db.session.commit()

        login_user(nuevo_usuario)
        flash('¡Cuenta creada exitosamente! Bienvenido.', 'success')
        return redirect(url_for('cliente_dashboard'))

    return render_template('registro.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Sesión cerrada correctamente.', 'info')
    return redirect(url_for('index'))


# ========================
# PANEL DEL CLIENTE
# ========================
@app.route('/cliente')
@login_required
def cliente_dashboard():
    pedidos = Pedido.query.filter_by(usuario_id=current_user.id).order_by(Pedido.fecha_creacion.desc()).all()
    reservas = Reserva.query.filter_by(usuario_id=current_user.id).order_by(Reserva.fecha_creacion.desc()).all()
    return render_template('cliente/dashboard.html', pedidos=pedidos, reservas=reservas)


# ========================
# PANEL ADMINISTRATIVO
# ========================
@app.route('/admin')
@login_required
@admin_required
def admin_dashboard():
    total_pedidos = Pedido.query.count()
    pedidos_pendientes = Pedido.query.filter_by(estado='Pendiente').count()
    total_reservas = Reserva.query.count()
    reservas_pendientes = Reserva.query.filter_by(estado='Pendiente').count()
    total_contactos = Contacto.query.count()
    contactos_no_leidos = Contacto.query.filter_by(leido=False).count()
    total_usuarios = Usuario.query.count()
    total_cotizaciones = Cotizacion.query.count()

    return render_template('admin/dashboard.html',
                           total_pedidos=total_pedidos,
                           pedidos_pendientes=pedidos_pendientes,
                           total_reservas=total_reservas,
                           reservas_pendientes=reservas_pendientes,
                           total_contactos=total_contactos,
                           contactos_no_leidos=contactos_no_leidos,
                           total_usuarios=total_usuarios,
                           total_cotizaciones=total_cotizaciones)


@app.route('/admin/pedidos')
@login_required
@admin_required
def admin_pedidos():
    pedidos = Pedido.query.order_by(Pedido.fecha_creacion.desc()).all()
    return render_template('admin/pedidos.html', pedidos=pedidos)


@app.route('/admin/pedido/nuevo', methods=['GET', 'POST'])
@login_required
@admin_required
def admin_nuevo_pedido():
    if request.method == 'POST':
        distancia = float(request.form.get('distancia_km', 0))
        peso = float(request.form.get('peso_kg', 0))
        tipo = request.form.get('tipo_servicio', 'paqueteria')

        precio_distancia = distancia * app.config['PRECIO_POR_KM']
        precio_peso = peso * app.config['PRECIO_POR_KG']
        precio_total = precio_distancia + precio_peso

        multiplicadores = {
            'paqueteria': 1.0, 'mudanza': 1.5, 'personas': 0.8,
            'express': 2.0, 'carga_pesada': 1.8, 'delivery': 1.2,
        }
        precio_total *= multiplicadores.get(tipo, 1.0)

        nuevo_pedido = Pedido(
            origen=request.form['origen'],
            destino=request.form['destino'],
            descripcion=request.form.get('descripcion', ''),
            peso_kg=peso,
            distancia_km=distancia,
            tipo_servicio=tipo,
            precio_total=round(precio_total, 2),
            nombre_remitente=request.form.get('nombre_remitente', ''),
            telefono_remitente=request.form.get('telefono_remitente', ''),
            nombre_destinatario=request.form.get('nombre_destinatario', ''),
            telefono_destinatario=request.form.get('telefono_destinatario', ''),
        )
        db.session.add(nuevo_pedido)
        db.session.commit()
        flash(f'Pedido creado. Código de rastreo: {nuevo_pedido.tracking_code}', 'success')
        return redirect(url_for('admin_pedidos'))
    return render_template('admin/nuevo_pedido.html')


@app.route('/admin/pedido/<int:id>/estado', methods=['POST'])
@login_required
@admin_required
def admin_actualizar_estado(id):
    pedido = Pedido.query.get_or_404(id)
    nuevo_estado = request.form.get('estado')
    if nuevo_estado:
        pedido.estado = nuevo_estado
        db.session.commit()
        flash(f'Estado del pedido {pedido.tracking_code} actualizado a: {nuevo_estado}', 'success')
    return redirect(url_for('admin_pedidos'))


@app.route('/admin/reservas')
@login_required
@admin_required
def admin_reservas():
    reservas = Reserva.query.order_by(Reserva.fecha_creacion.desc()).all()
    return render_template('admin/reservas.html', reservas=reservas)


@app.route('/admin/reserva/<int:id>/estado', methods=['POST'])
@login_required
@admin_required
def admin_actualizar_reserva(id):
    reserva = Reserva.query.get_or_404(id)
    nuevo_estado = request.form.get('estado')
    if nuevo_estado:
        reserva.estado = nuevo_estado
        db.session.commit()
        flash(f'Reserva #{reserva.id} actualizada a: {nuevo_estado}', 'success')
    return redirect(url_for('admin_reservas'))


@app.route('/admin/contactos')
@login_required
@admin_required
def admin_contactos():
    contactos = Contacto.query.order_by(Contacto.fecha_creacion.desc()).all()
    return render_template('admin/contactos.html', contactos=contactos)


@app.route('/admin/contacto/<int:id>/leido', methods=['POST'])
@login_required
@admin_required
def admin_marcar_leido(id):
    contacto = Contacto.query.get_or_404(id)
    contacto.leido = True
    db.session.commit()
    return redirect(url_for('admin_contactos'))


@app.route('/admin/usuarios')
@login_required
@admin_required
def admin_usuarios():
    usuarios = Usuario.query.order_by(Usuario.fecha_registro.desc()).all()
    return render_template('admin/usuarios.html', usuarios=usuarios)


@app.route('/admin/cotizaciones')
@login_required
@admin_required
def admin_cotizaciones():
    cotizaciones = Cotizacion.query.order_by(Cotizacion.fecha_creacion.desc()).all()
    return render_template('admin/cotizaciones.html', cotizaciones=cotizaciones)


# ========================
# INICIALIZACIÓN
# ========================
def init_db():
    """Crea las tablas y el usuario admin por defecto."""
    with app.app_context():
        db.create_all()
        # Crear admin si no existe
        admin = Usuario.query.filter_by(email='admin@puertaapuerta.ec').first()
        if not admin:
            admin = Usuario(
                nombre='Administrador',
                email='admin@puertaapuerta.ec',
                telefono='+593999999999',
                es_admin=True
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print('[OK] Usuario admin creado: admin@puertaapuerta.ec / admin123')


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5001)
