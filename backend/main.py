from fastapi import FastAPI, WebSocket
import random
import asyncio

app = FastAPI()

class GameManager:
    def __init__(self):
        self.players = {}

    async def adjust_difficulty(self, player_id):
        while True:
            if player_id in self.players:
                score = self.players[player_id]['score']
                new_difficulty = min(10, max(1, int(score) // 5))  # ✅ Increase every 5 points

                # ✅ Only update difficulty when it actually changes
                if self.players[player_id]['difficulty'] != new_difficulty:
                    self.players[player_id]['difficulty'] = new_difficulty
                    print(f"✅ Difficulty Updated to {new_difficulty}")

            await asyncio.sleep(2)  # ✅ Adjust timing to check more frequently




    async def connect_player(self, websocket: WebSocket, player_id: str):
        await websocket.accept()
        self.players[player_id] = {"score": 0, "difficulty": 1}
        asyncio.create_task(self.adjust_difficulty(player_id))
        try:
            while True:
                data = await websocket.receive_json()
                if "score" in data:
                    self.players[player_id]["score"] = data["score"]
                while True:
                    await websocket.send_json(self.players[player_id])  # ✅ Send the latest difficulty
                    await asyncio.sleep(2)  # ✅ Ensure updates are sent regularly
        except Exception as e:
            del self.players[player_id]
            print(f"Player {player_id} disconnected: {e}")

manager = GameManager()

@app.websocket("/game/{player_id}")
async def websocket_endpoint(websocket: WebSocket, player_id: str):
    await manager.connect_player(websocket, player_id)
