from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, BigInteger, Text
from sqlalchemy.orm import relationship, declarative_base
from datetime import date

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    streak = Column(Integer, default=0, nullable=False)

    game_results = relationship("GameResult", back_populates="user")

class GameResult(Base):
    __tablename__ = "game_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    session_id = Column(String, index=True, nullable=True)
    date = Column(Date, default=date.today, index=True)
    game_type = Column(String, default="player", nullable=False, index=True)
    attempts_used = Column(Integer, nullable=False)
    solved = Column(Boolean, default=False)
    target_player_id = Column(BigInteger, ForeignKey("players.player_id"))
    target_club_id = Column(Text, nullable=True)

    user = relationship("User", back_populates="game_results")
    target_player = relationship("Player")

class Player(Base):
    __tablename__ = "players"

    player_id = Column(BigInteger, primary_key=True, index=True)
    player_slug = Column(Text)
    player_name = Column(Text)
    player_image_url = Column(Text)
    date_of_birth = Column(Text)
    country_of_birth = Column(Text)
    height = Column(Text)
    citizenship = Column(Text)
    position = Column(Text)
    main_position = Column(Text)
    current_club_id = Column(Text)
    current_club_name = Column(Text)

class Club(Base):
    __tablename__ = "clubs"
    club_id = Column(Text, primary_key=True)
    club_name = Column(Text)
    country_name = Column(Text)
    season_id = Column(Text)
    competition_id = Column(Text)

class Competition(Base):
    __tablename__ = "competitions"
    club_id = Column(Text, primary_key=True)
    competition_id = Column(Text, primary_key=True)
    competition_name = Column(Text)
    season_id = Column(Text, primary_key=True)
    season_rank = Column(Text)
