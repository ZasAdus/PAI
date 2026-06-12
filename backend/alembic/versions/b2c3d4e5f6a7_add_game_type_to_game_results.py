"""add game_type and target_club_id to game_results

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-12 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('game_results', sa.Column('game_type', sa.String(), nullable=True, server_default='player'))
    op.add_column('game_results', sa.Column('target_club_id', sa.Text(), nullable=True))
    op.create_index(op.f('ix_game_results_game_type'), 'game_results', ['game_type'], unique=False)
    op.execute("UPDATE game_results SET game_type = 'player' WHERE game_type IS NULL")
    op.alter_column('game_results', 'game_type', nullable=False, server_default=None)


def downgrade():
    op.drop_index(op.f('ix_game_results_game_type'), table_name='game_results')
    op.drop_column('game_results', 'target_club_id')
    op.drop_column('game_results', 'game_type')
