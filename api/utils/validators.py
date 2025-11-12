def is_valid_discord_id(discord_id: str) -> bool:
    """
    DEPRECATED: Use DiscordBotService.is_valid_discord_id() instead.

    This is a basic format validator that only checks if the discord_id
    can be converted to an integer. It does NOT verify if the user actually exists.

    Validate Discord ID format.
    Discord IDs should be non-empty strings that can be converted to integers.

    Args:
        discord_id: The Discord ID to validate

    Returns:
        True if valid format, False otherwise
    """
    if not discord_id or not discord_id.strip():
        return False

    try:
        int(discord_id)
        return True
    except (ValueError, TypeError):
        return False
