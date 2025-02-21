from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio

app = FastAPI()

class GameManager:
    def __init__(self):
        self.players = {}

    async def adjust_difficulty(self, player_id):
        while True:
            if player_id in self.players:
                score = self.players[player_id]['score']
                new_difficulty = min(10, max(1, int(score) // 5))  # ✅ Increase difficulty every 5 points

                # ✅ Update difficulty only when it changes
                if self.players[player_id]['difficulty'] != new_difficulty:
                    self.players[player_id]['difficulty'] = new_difficulty
                    print(f"✅ Difficulty Updated for {player_id}: {new_difficulty}")

            await asyncio.sleep(2)  # ✅ Adjust frequency

    async def connect_player(self, websocket: WebSocket, player_id: str):
        await websocket.accept()
        self.players[player_id] = {"score": 0, "difficulty": 1}
        
        asyncio.create_task(self.adjust_difficulty(player_id))  # ✅ Start difficulty adjustment task

        try:
            while True:
                data = await websocket.receive_json()
                
                if "score" in data:
                    self.players[player_id]["score"] = data["score"]

                # ✅ Send updated game state
                await websocket.send_json(self.players[player_id])
                
                await asyncio.sleep(2)  # ✅ Prevents spamming messages too fast

        except WebSocketDisconnect:
            print(f"Player {player_id} disconnected.")
            del self.players[player_id]  # ✅ Cleanup after disconnect
        except Exception as e:
            print(f"Error: {e}")

manager = GameManager()

@app.get("/")
def home():
    return {"message": "AI Runner Game Backend is Live!"}  # ✅ Fixes 404 error

@app.websocket("/game/{player_id}")
async def websocket_endpoint(websocket: WebSocket, player_id: str):
    await manager.connect_player(websocket, player_id)
