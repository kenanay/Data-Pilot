"""SQLAlchemy declarative base shared across the application.

Historically this module defined its own ``declarative_base`` instance.
That meant tests importing :mod:`app.models.base` ended up operating on a
different metadata registry than the rest of the application, leading to
missing tables and inconsistent behaviour.  To ensure a single source of
truth we now simply expose the ``Base`` class from
``app.core.database``.
"""

from app.core.database import Base

__all__ = ["Base"]

