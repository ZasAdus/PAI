"""add session_id to game_results

Revision ID: 7a123456789b
Revises: 641176e1427a
Create Date: 2026-06-12 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7a123456789b'
down_revision = '641176e1427a'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('game_results', sa.Column('session_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_game_results_session_id'), 'game_results', ['session_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_game_results_session_id'), table_name='game_results')
    op.drop_column('game_results', 'session_id')
