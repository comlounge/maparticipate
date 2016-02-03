# coding=utf-8

import pymongo
import yaml
import pkg_resources

from starflyer import Application, URL, AttributeMapper
from sfext.mail import mail_module
from sfext.babel import babel_module, T

import markdown
import bleach

import re
from jinja2 import evalcontextfilter, Markup, escape

# modules
import userbase

# handlers
import handlers

# database
import db

# segments
from segments import SEGMENTS

#
# custom jinja filters
#

_paragraph_re = re.compile(r'(?:\r\n|\r|\n){2,}')
_striptags_re = re.compile(r'(<!--.*?-->|<[^>]*>)')

@evalcontextfilter
def nl2br(eval_ctx, value):
    value = _striptags_re.sub(' ', value)
    result = u'\n\n'.join(u'<p>%s</p>' % p.replace('\n', '<br>\n')
                      for p in _paragraph_re.split(escape(value)))
    if eval_ctx.autoescape:
        result = Markup(result)
    return result

try:
    import simplejson as json
except ImportError:
    import json

if '\\/' not in json.dumps('/'):

    def _tojson_filter(*args, **kwargs):
        return json.dumps(*args, **kwargs).replace('/', '\\/')
else:
    _tojson_filter = json.dumps

def markdownify(text, level=1):
    return bleach.linkify(markdown.markdown(text, safe_mode="remove", extensions=['nl2br', 'headerid(level=%s)' %level]))

### i18n

def get_locale(handler):
    """we only suppport de but we use babel to re-use translations"""

    l = "de"
    handler.session['LANG'] = l
    return l

###
### userbase config
###

import userbase
from userbase import EMailUserModule
from userbase.handlers.forms import EMailRegistrationForm
from wtforms import TextField, PasswordField, validators
import copy

class MPRegistrationForm(EMailRegistrationForm):
    email       = TextField(T(u'E-Mail'),       [validators.Length(max=200), validators.Email(), validators.Required()],
            description = T(u'Your E-Mail address will never be publically visible'))
    password    = PasswordField(T('Password'), [validators.Required(), validators.EqualTo('password2', message=T('Passwords must match'))],
            description = T(u"For your own security, please choose a long and secure password you use nowhere else."))
    password2   = PasswordField(T('Password confirmation'), [validators.Length(max=135), validators.Required()])
    fullname    = TextField(T('Full name'), [validators.Length(max=200), validators.Required()], 
            description = T(u"Your full name is visible to the public under your proposals and comments."))


class MPEMailUserModule(EMailUserModule):
    """extends the email user module from userbase with own form"""

    defaults = copy.copy(EMailUserModule.defaults)
    defaults.update({
        'registration_form' : MPRegistrationForm
    })

mp_userbase = MPEMailUserModule(userbase.__name__)

###
### APP
###

class CollaborativeMapApp(Application):
    """Maparticipate Planning Mapping WSGI application"""

    defaults = {
        'log_name'              : "maparticipate",
        'script_virtual_host'   : "http://localhost:9876",
        'virtual_host'          : "http://localhost:9876",
        'virtual_path'          : "",
        'server_name'           : "dev.localhost:9876",
        'title'                 : "Maparticipate Route Planner",
        'description'           : "Maparticipate Route Planner for project X",
        'debug'                 : True,
        'mongodb_name'          : "maparticipate",
        'mongodb_port'          : 27017,
        'mongodb_host'          : "localhost",
        'mapbox_access_token'   : "",
        'mapbox_map_id'         : "",
        'secret_key'            : "ci8c7si87c6sd98c7sd9c7s9d87cns978cns987cns98c7nsd98c7ns9c87cns98c7ns9c87nsd9c7n",
        'session_cookie_domain' : "dev.localhost",
        'smtp_host'             : 'localhost',
        'smtp_port'             : 25,
        'from_addr'             : "noreply@example.org",
        'from_name'             : "Maparticipate Route Planner",
        'show_elevation'        : True,
    }

    modules = [
        babel_module(
            locale_selector_func = get_locale,
        ),
        mp_userbase(
            url_prefix                  = "/users",
            mongodb_name                = "maparticipate",
            master_template             = "master.html",
            login_after_registration    = True,
            double_opt_in               = True,
            enable_registration         = True,
            enable_usereditor           = True,
            use_remember                = True,
            urls                        = {
                'activation'            : {'endpoint' : 'userbase.activate'},
                'activation_success'    : {'endpoint' : 'index'},
                'activation_code_sent'  : {'endpoint' : 'userbase.activate'},
                'login_success'         : {'endpoint' : 'index'},
                'logout_success'        : {'endpoint' : 'userbase.login'},
                'registration_success'  : {'endpoint' : 'userbase.login'},
            },
            subjects                    = AttributeMapper({
                'registration'          : T(u'Your Registration is now finished'),
                'welcome'               : T(u'Welcome to the collaborative route planning tool'),
                'password'              : T(u'Reset password'),
                'pw_code'               : T(u'Your Code to reset your password'),
            }),
            messages                    = AttributeMapper({
                'user_unknown'          : T('User unknown'),
                'email_unknown'         : T('This email address cannot not be found in our user database'),
                'password_incorrect'    : T('Your password is not correct'),
                'user_not_active'       : T('Your user has not yet been activated.'), # maybe provide link here? Needs to be constructed in handler
                'login_failed'          : T('Login failed'),
                'login_success'         : T(u'Herzlich Willkommen, %(fullname)s'),
                'logout_success'        : T(u'You are now logged in'),
                'double_opt_in_pending' : T(u'We sent you further instructions via e-mail on how to finish your registration. Please also check your spam folder.'),
                'registration_success'  : T(u'Your registration was successful.'),
                'activation_success'    : T(u'Your account is now activated.'),
                'activation_failed'     : T(u'The activation code is not valid. Please try again or <a href="%(url)s">click here</a> in order to receive a new code.'),
                'activation_code_sent'  : T(u'We sent you another activation code. Please check out e-mail account including your spam folder.'),
                'already_active'        : T(u'Your account is already active, please login'),
                'pw_code_sent'          : T(u'A link with instructions on how to reset your password has been sent to you via e-mail. Please check out e-mail account including your spam folder.'),
                'pw_changed'            : T(u'Your password has been changed.'),

                # for user manager
                'user_edited'           : T('The user has been updated.'),
                'user_added'            : T('The user has been added.'),
                'user_deleted'          : T('The user has been deleted.'),
                'user_activated'        : T('The user has been activated.'),
                'user_deactivated'      : T('The user has been deactivated.'),
            }),

            permissions                 = AttributeMapper({
                'userbase:admin'    : T("can manage users"),
                'admin'             : T("main administrator"),
            })
        ),
        mail_module(debug=True),
    ]

    jinja_filters = {
        'nl2br' : nl2br,
        'tojson' : _tojson_filter,
        'md' : markdownify,
    }

    routes = [
        URL('/', 'index', handlers.index.IndexView),
        URL('/', 'root', handlers.index.IndexView),
        URL('/comments/', 'comment_overview', handlers.index.CommentOverview),
        URL('/mapcomments_all/', 'mapcomments_all', handlers.index.MapComments),
        URL('/segments/', 'segment_overview', handlers.segment.SegmentOverview),
        URL('/segments/<seg_id>/', 'segment_view', handlers.segment.SegmentView),
        URL('/segments/<seg_id>/neu', 'proposal_add', handlers.proposal.ProposalAdd),
        URL('/segments/<seg_id>/<p_id>', 'proposal_view', handlers.proposal.ProposalView),
        URL('/segments/<seg_id>/<p_id>/edit', 'proposal_edit', handlers.proposal.ProposalEdit),
        URL('/segments/<seg_id>/<p_id>/danke', 'submit_success', handlers.proposal.SubmitThankYou),
        URL('/segments/<seg_id>/<p_id>/workflow', 'proposal_workflow', handlers.proposal.ProposalWorkflow),
        URL('/segments/<seg_id>/<p_id>/comment/new', 'comment_add', handlers.proposal.CommentAdd),
        URL('/segments/<seg_id>/<p_id>/comment/<comment_id>', 'comment_view', handlers.proposal.CommentView),
        URL('/segments/<seg_id>/<p_id>/mapcomments', 'proposal_mapcomments', handlers.proposal.MapComments),
        URL('/my_proposals', 'own_proposals', handlers.proposal.ProposalOwnOverview),

        URL('/imprint.html', 'impressum', handlers.index.Impressum),

        # admin area
        #URL('/sradmin/', "admin_index", handlers.admin.index.IndexView),
    ]

    def finalize_setup(self):
        """do our own configuration stuff"""
        self.config.dbs = AttributeMapper()
        mydb = self.config.dbs.db = pymongo.MongoClient(
            self.config.mongodb_host,
            int(self.config.mongodb_port)
        )[self.config.mongodb_name]
        self.config.dbs.proposals = db.Proposals(mydb.proposals, app=self, config=self.config)
        self.config.dbs.comments = db.Comments(mydb.comments, app=self, config=self.config)
        self.config.dbs.mapcomments = db.MapComments(mydb.mapcomments, app=self, config=self.config)

        self.config.segments = SEGMENTS



from werkzeug import DebuggedApplication

def test_app(config, **local_config):
    """return the app for testing"""
    return CollaborativeMapApp(__name__, local_config)


def app(config, **local_config):
    """return the config"""
    app = CollaborativeMapApp(__name__, local_config)
    if app.config.debug:
        return DebuggedApplication(app)
    return app


