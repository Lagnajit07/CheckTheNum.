# backend/routers/ws_routes.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from database.memory_db import connections

router = APIRouter(prefix="/ws")  # <- prefix ensures /ws/ route

@router.websocket("/{game_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str):
    await websocket.accept()

    if game_id not in connections:
        connections[game_id] = set()

    connections[game_id].add(websocket)

    try:
        while True:
            data = await websocket.receive_json()

            # broadcast to all in the same game
            for ws in list(connections[game_id]):
                try:
                    await ws.send_json(data)
                except:
                    pass

    except WebSocketDisconnect:
        if websocket in connections[game_id]:
            connections[game_id].remove(websocket)
