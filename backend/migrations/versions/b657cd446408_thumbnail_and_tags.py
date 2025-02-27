"""thumbnail and tags

Revision ID: b657cd446408
Revises: cae6ea2bf677
Create Date: 2025-02-25 00:45:33.450164

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b657cd446408'
down_revision = 'cae6ea2bf677'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('message', schema=None) as batch_op:
        batch_op.add_column(sa.Column('thumbnail', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('tags', sa.Text(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('message', schema=None) as batch_op:
        batch_op.drop_column('tags')
        batch_op.drop_column('thumbnail')

    # ### end Alembic commands ###
