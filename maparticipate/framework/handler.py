#encoding=utf8
import starflyer

class BaseHandler(starflyer.Handler):
    """an extended handler """

    remember_url = False

    selected_action = None
    wf_map = {
        u'created'      : u"angelegt",
        u'announced'    : u"angekündigt ",
        u'open'         : u"Registrierung offen ",
        u'running'      : u"findet statt",
        u'closed'       : u"abgeschlossen",
    }

    def before(self):
        """prepare the handler"""
        super(BaseHandler, self).before()

    @property
    def is_admin(self):
        """true if the logged in user is an admin"""
        if self.user is None:
            return False
        return self.user.has_permission("admin")

    @property
    def is_moderator(self):
        """true if the logged in user is a moderator"""
        if self.user is None:
            return False
        return self.user.has_permission("moderator")

    @property
    def logged_in(self):
        """check if the given user is logged in"""
        return self.user is not None

    @property
    def render_context(self):
        """provide more information to the render method"""
        payload = dict(
            user = self.user,
            user_id = self.user_id,
            title = self.config.title,
            url = self.request.url,
            description = self.config.description,
            vpath = self.config.virtual_path,
            vhost = self.config.virtual_host,
            is_admin = self.is_admin,
            is_moderator = self.is_moderator,
            mapbox_access_token = self.config.mapbox_access_token,
            mapbox_map_id = self.config.mapbox_map_id,
            locale = str(self.babel_locale),
            show_elevation = str(self.config.show_elevation).lower() == "true",
        )
        return payload

    def can_propose(self, seg_id):
        """check if user can add new proposals for a segment"""
        seg = self.config.segments[seg_id]
        own_proposals = list(self.config.dbs.proposals.by_userid(self.user_id, segment = seg_id, workflow = ['published', 'draft']))
        return len(own_proposals) < 3
    
    def mail_text(self, template_name, subject, send_to=None, user = None, **kwargs):
        """render and send out a mail as mormal text"""
        if user is None:
            user = self.user
        if send_to is None:
            send_to = user.email
        payload = self.render_lang(template_name, **kwargs)
        mailer = self.app.module_map['mail']
        mailer.mail(send_to, subject, payload)

    def mail(self, tmplname, send_to = None, user = None, subject = "", **kwargs):
        """render and send out a mail as html and text"""
        if user is None:
            user = self.user
        if send_to is None:
            send_to = user.email
        mailer = self.app.module_map['mail']
        html = self.render("emails/"+tmplname+".html", **kwargs)
        txt = self.render("emails/"+tmplname+".txt", **kwargs)
        mailer.mail_html(send_to, subject, txt, html)
