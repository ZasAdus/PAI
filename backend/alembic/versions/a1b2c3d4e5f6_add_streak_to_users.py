"""add streak column to users

Revision ID: a1b2c3d4e5f6
Revises: 7a123456789b
Create Date: 2026-06-12 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '7a123456789b'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('streak', sa.Integer(), nullable=True, server_default='0'))


def downgrade():
    op.drop_column('users', 'streak')
