#encoding=utf8

import functools

from starflyer import redirect


class is_admin(object):
    """ensure that the logged in user is an admin"""

    def __call__(self, method):
        @functools.wraps(method)
        def wrapper(self, *args, **kwargs):
            if self.user is None:
                self.flash("Sie haben nicht die erforderlichen Rechte, diese Seite einzusehen", category="danger")
                return redirect(self.url_for("index"))
            if self.user.has_permission("admin"):
                return method(self, *args, **kwargs)
            self.flash("Sie haben nicht die erforderlichen Rechte, diese Seite einzusehen", category="danger")
            return redirect(self.url_for("index"))
        return wrapper


class logged_in(object):
    """check if a valid user is present"""

    def __call__(self, method):
        """check user"""
        @functools.wraps(method)
        def wrapper(self, *args, **kwargs):
            if self.user is None:
                self.flash('Bitte loggen Sie sich ein.', category="danger")
                return redirect(self.url_for("userbase.login", force_external=True))
            return method(self, *args, **kwargs)
        return wrapper

