"""tags table

Revision ID: d61229fc3911
Revises: b657cd446408
Create Date: 2025-02-26 11:31:22.833703

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd61229fc3911'
down_revision = 'b657cd446408'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('tag',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=80), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_table('message_tags',
    sa.Column('message_id', sa.Integer(), nullable=False),
    sa.Column('tag_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['message_id'], ['message.id'], ),
    sa.ForeignKeyConstraint(['tag_id'], ['tag.id'], ),
    sa.PrimaryKeyConstraint('message_id', 'tag_id')
    )
    with op.batch_alter_table('message', schema=None) as batch_op:
        batch_op.create_unique_constraint('message_title', ['title'])
        batch_op.drop_column('tags')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('message', schema=None) as batch_op:
        batch_op.add_column(sa.Column('tags', sa.TEXT(), nullable=True))
        batch_op.drop_constraint(None, type_='unique')

    op.drop_table('message_tags')
    op.drop_table('tag')
    # ### end Alembic commands ###
