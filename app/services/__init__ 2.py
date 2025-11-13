"""
Service layer package.

Business logic modules (for example, pet management, financial services, and
AI integrations) will live here. Each service will expose async-friendly
functions that can be reused across routers.
"""

from app.services.ai_chat_service import ai_chat_service
from app.services.analytics_service import (
    analytics_snapshot,
    end_of_day_report,
    export_reports_csv,
    generate_daily_snapshot,
    generate_period_snapshot,
    weekly_summary,
)
from app.services.art_service import pet_art_service
from app.services.auth_service import SupabaseAuthService, refresh_token_store, supabase_auth_service
from app.services.finance_service import (
    FinanceResponse,
    FinanceSummary,
    InsufficientFundsError,
    earn_coins,
    get_finance_response,
    get_finance_summary,
    get_leaderboard_summary,
    purchase_items,
)
from app.services.profile_service import (
    ProfileNotFoundError,
    create_profile as create_user_profile,
    delete_profile as delete_user_profile,
    get_profile as get_user_profile,
    set_avatar_url as set_profile_avatar_url,
    update_profile as update_user_profile,
)
from app.services.coach_service import generate_coach_advice
from app.services.games_service import GameRuleError, get_games_leaderboard
from app.services.next_gen_service import (
    current_seasonal_event,
    fetch_weather_reaction,
    generate_ar_session,
    pet_social_interaction,
    predict_user_habits,
    save_cloud_state,
    voice_command_intent,
)
from app.services.pet_service import (
    PetAlreadyExistsError,
    PetNotFoundError,
    create_pet,
    get_pet_by_user,
    update_pet,
)
from app.services.quest_service import (
    QuestAlreadyCompletedError,
    QuestNotFoundError,
    complete_quest,
    get_active_quests,
)
from app.services.social_service import (
    FriendRequestExistsError,
    FriendRequestNotFoundError,
    FriendRequestPermissionError,
    fetch_leaderboard,
    fetch_public_profiles,
    list_friendships,
    respond_to_friend_request,
    send_friend_request,
)
from app.services.sync_service import apply_sync, fetch_cloud_state
from app.services.user_service import (
    UserAlreadyExistsError,
    UserNotFoundError,
    create_user,
    get_user_by_email,
    get_user_model_by_email,
    list_users,
    update_user,
)

__all__ = [
    "PetAlreadyExistsError",
    "PetNotFoundError",
    "UserAlreadyExistsError",
    "UserNotFoundError",
    "create_pet",
    "create_user",
    "get_pet_by_user",
    "get_user_by_email",
    "get_user_model_by_email",
    "list_users",
    "update_pet",
    "update_user",
    "FinanceSummary",
    "FinanceResponse",
    "get_finance_summary",
    "get_finance_response",
    "earn_coins",
    "purchase_items",
    "get_leaderboard_summary",
    "InsufficientFundsError",
    "get_games_leaderboard",
    "GameRuleError",
    "analytics_snapshot",
    "weekly_summary",
    "end_of_day_report",
    "export_reports_csv",
    "generate_daily_snapshot",
    "generate_period_snapshot",
    "pet_social_interaction",
    "voice_command_intent",
    "generate_ar_session",
    "save_cloud_state",
    "fetch_weather_reaction",
    "predict_user_habits",
    "current_seasonal_event",
    "list_friendships",
    "send_friend_request",
    "respond_to_friend_request",
    "fetch_public_profiles",
    "fetch_leaderboard",
    "FriendRequestExistsError",
    "FriendRequestNotFoundError",
    "FriendRequestPermissionError",
    "get_active_quests",
    "complete_quest",
    "QuestNotFoundError",
    "QuestAlreadyCompletedError",
    "generate_coach_advice",
    "fetch_cloud_state",
    "apply_sync",
    "SupabaseAuthService",
    "supabase_auth_service",
    "refresh_token_store",
    "ProfileNotFoundError",
    "create_user_profile",
    "update_user_profile",
    "delete_user_profile",
    "get_user_profile",
    "set_profile_avatar_url",
    "ai_chat_service",
    "pet_art_service",
]

