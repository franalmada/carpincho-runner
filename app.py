from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app) 


DB_CONFIG = {
    'dbname': 'carpincho_runner_db',
    'user': 'postgres',
    'password': '123456', 
    'host': 'localhost',
    'port': '5432'
}


@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT posicion, nickname, mejor_puntaje, fecha_record FROM vista_top_10;")
        rows = cur.fetchall()
        
        ranking = []
        for row in rows:
            ranking.append({
                'posicion': row[0],
                'nickname': row[1],
                'puntaje': row[2],
                'fecha': row[3]
            })
            
        return jsonify(ranking)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)


@app.route('/api/start-game', methods=['POST'])
def start_game():
    data = request.json
    nickname = data.get('nickname')
    pin = data.get('pin')
    
    if not nickname or not pin:
        return jsonify({'error': 'Faltan datos'}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            INSERT INTO sesiones_juego (nickname, telefono_cod, inicio_juego)
            VALUES (%s, %s, NOW())
            RETURNING session_id;
        """, (nickname, pin))
        
        session_id = cur.fetchone()[0]
        conn.commit()
        
        return jsonify({'session_id': session_id, 'status': 'ok'})
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/submit-score', methods=['POST'])
def submit_score():
    data = request.json
    session_id = data.get('session_id')
    score_reclamado = data.get('score')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT inicio_juego FROM sesiones_juego WHERE session_id = %s", (session_id,))
        resultado = cur.fetchone()
        
        if not resultado:
            return jsonify({'error': 'Sesión no válida'}), 404
            
        start_time = resultado[0]
        
        
        ahora = datetime.now(start_time.tzinfo) 
        tiempo_jugado = (ahora - start_time).total_seconds()
        
        max_posible = (tiempo_jugado + 2) * 1.5 
        
        es_valido = True
        motivo = None
        
        if score_reclamado > max_posible: 
            es_valido = False
            motivo = f"Imposible: Hizo {score_reclamado} en {tiempo_jugado:.2f}s"
            print(f"⚠️ ALERTA DE TRAMPOSO: {motivo}")

        cur.execute("""
            UPDATE sesiones_juego 
            SET fin_juego = NOW(), 
                puntaje_final = %s, 
                es_valido = %s,
                motivo_rechazo = %s
            WHERE session_id = %s
        """, (score_reclamado, es_valido, motivo, session_id))
        
        conn.commit()
        
        return jsonify({'valid': es_valido, 'message': 'Puntaje registrado'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)


    