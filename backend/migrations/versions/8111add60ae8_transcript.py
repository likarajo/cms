"""transcript

Revision ID: 8111add60ae8
Revises: 87378a4a1454
Create Date: 2025-02-26 15:57:51.450018

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8111add60ae8'
down_revision = '87378a4a1454'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('message', schema=None) as batch_op:
        batch_op.add_column(sa.Column('transcript', sa.Text(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('message', schema=None) as batch_op:
        batch_op.drop_column('transcript')

    # ### end Alembic commands ###
