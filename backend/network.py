from fastapi import APIRouter
from .db import driver
import logging

log = logging.getLogger(__name__)

def setup_network_routes(router: APIRouter):

    @router.get("/network/stat")
    async def get_network_stats():
        try:
            with driver.session() as session:
                # 查询所有人的数量
                result = session.run("""
                    MATCH (p:Person)
                    RETURN count(p) as total_people
                """)
                stats = result.single()
                return {
                    "total_people": stats["total_people"]
                }
        except Exception as e:
            log.error(f"Error getting network stats: {e}")
            return {"error": "Failed to get network stats"}
