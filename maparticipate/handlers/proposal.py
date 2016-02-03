#encoding=utf8

import datetime
import pymongo
import json

from starflyer import redirect
from starflyer.decorators import asjson

from maparticipate.framework import BaseHandler
from maparticipate.decorators import is_admin, logged_in


class ProposalView(BaseHandler):
    """view for showing segment and editing proposals"""

    template = "proposal_view.html"

    def get(self, seg_id=None, p_id=None):
        """render the view"""
        seg = self.config.segments[seg_id]
        proposal = self.config.dbs.proposals.get(p_id)
        comments = list(self.config.dbs.comments.by_proposal(p_id, workflow="public"))
        return self.render(
            seg = seg,
            title = self.config.title+": "+self._('Route proposal by {name}').format(name = proposal.author_name),
            seg_id = seg_id,
            p = proposal,
            comments = comments
        )
    post = get

    @is_admin()
    def delete(self, seg_id = None, p_id = None):
        """delete a proposal"""
        p = self.config.dbs.proposals.get(p_id)
        p.set_workflow("deleted")
        p.save()
        self.flash(u"Der Vorschlag wurde erfolgreich gelöscht", category="danger")
        return redirect(self.url_for('segment_view', seg_id=seg_id))




class ProposalOwnOverview(BaseHandler):
    """view for showing segment and editing proposals"""

    template = "proposal_own_overview.html"

    @logged_in()
    def get(self):
        """render the view"""
        drafts = self.config.dbs.proposals.by_userid(unicode(self.user._id), workflow=['draft'])
        published = self.config.dbs.proposals.by_userid(unicode(self.user._id), workflow=['published'])
        return self.render(
            drafts=drafts,
            published=published
        )
    post = get


class ProposalAdd(BaseHandler):
    """view for showing segment and editing proposals"""

    template = "proposal_edit.html"

    @logged_in()
    def get(self, seg_id=None):
        """render the view"""
        if not self.can_propose(seg_id):
            self.flash(u"Sie können nur bis zu 3 Vorschläge pro Teilstrecke erstellen", category="danger")
            return redirect(self.url_for("segment_view", seg_id = seg_id))
        seg = self.config.segments[seg_id]
        back_url = self.url_for('segment_view', seg_id=seg_id)
        p = None
        if 'p_id' in self.request.args.keys():
            p = self.config.dbs.proposals.get(self.request.args['p_id'])
            back_url = self.url_for('proposal_view', seg_id=seg_id, p_id=p._id)
        return self.render(
            seg=seg,
            seg_id=seg_id,
            p=p,
            is_add=True,
            back_url=back_url
        )

    @logged_in()
    @asjson()
    def post(self, seg_id=None):
        """render the view"""
        if not self.can_propose(seg_id):
            return {'status': 'FAIL'}
        form = self.request.form
        if form.has_key("route"):
            proposal_data = {
                'author': unicode(self.user._id),
                'segment': seg_id,
                'description': form.get('description', ''),
                'route': form['route'],
                'original': form.get('original', None),
                'mapcomments': json.loads(form.get('mapcomments', '[]')),
            }
            p = self.config.dbs.proposals.create()
            if p['_id'] is None:
                del p['_id']
            p.update(proposal_data)
            p = self.config.dbs.proposals.save(p)
            return {
                'status': 'OK',
                'proposal_id': p._id,
                'edit_url': self.url_for('proposal_edit', seg_id=seg_id, p_id=p._id)
            }
        return {'status': 'FAIL'}


class ProposalEdit(BaseHandler):
    """view for showing segment and editing proposals"""

    template = "proposal_edit.html"

    @logged_in()
    def get(self, seg_id=None, p_id=None):
        """render the view"""
        seg = self.config.segments[seg_id]
        p = self.config.dbs.proposals.get(p_id)
        back_url = self.url_for('proposal_view', seg_id=seg_id, p_id=p._id)
        return self.render(
            seg = seg,
            seg_id = seg_id,
            p = p,
            back_url = back_url
        )

    @logged_in()
    @asjson()
    def post(self, seg_id=None, p_id=None):
        """render the view"""
        form = self.request.form
        if form.has_key("route"):
            proposal_data = {
                'author': unicode(self.user._id),
                'segment': seg_id,
                'description': form.get('description', ''),
                'route': form['route'],
                'original': form.get('original', None),
                'mapcomments': json.loads(form.get('mapcomments', '[]')),
            }
            p = self.config.dbs.proposals.get(p_id)
            p.update(proposal_data)
            p = self.config.dbs.proposals.save(p)
            return {'status': 'OK'}
        return {'status': 'FAIL'}


class ProposalWorkflow(BaseHandler):
    """view for showing segment and editing proposals"""

    @logged_in()
    def post(self, seg_id=None, p_id=None):
        """render the view"""
        form = self.request.form
        p = self.config.dbs.proposals.get(p_id)
        p.set_workflow(form.get("wf_state", None))
        p = self.config.dbs.proposals.save(p)
        if p.workflow == "published":

            url = self.url_for("proposal_view", _full=True, seg_id = seg_id, p_id = p_id)

            # send mail to author
            self.mail("submit_success", subject = self._(u"Thank you for your proposal"), url = url)

            # send mail to SR
            send_to = self.app.config.submit_emails
            if send_to:
                send_tos = [e.strip() for e in send_to.split(",")]
                for to in send_tos:
                    self.mail("submit_sr", send_to = to, subject = self._(u"New proposal"), url = url)

            return redirect(self.url_for("submit_success", seg_id=seg_id, p_id=p_id))
        else:
            return redirect(self.url_for("segment_view", seg_id=seg_id))


class CommentView(BaseHandler):
    """view for a comment which only implements delete for now"""

    @is_admin()
    def delete(self, seg_id = None, p_id = None, comment_id = None):
        """delete a comment and redirect back to proposal"""
        p = self.config.dbs.proposals.get(p_id)
        c = self.config.dbs.comments.get(comment_id)
        c.set_workflow("deleted")
        c.save()

        self.flash(self._(u"Comment deleted successfully"), category="danger")
        return redirect(self.url_for("proposal_view", seg_id = seg_id, p_id = p_id))



class CommentAdd(BaseHandler):
    """view for showing segment and editing proposals"""

    @logged_in()
    def post(self, seg_id=None, p_id=None):
        """render the view"""
        form = self.request.form
        p = self.config.dbs.proposals.get(p_id)
        if form.has_key("comment") and form['comment'].strip() != u'':
            c = self.config.dbs.comments.create()
            c.update(form.to_dict())
            c.author = unicode(self.user._id)
            c.proposal = p_id
            if self.user.has_permission("admin"):
                c.from_admin = True
            if self.user_id == p.author:
                c.from_author = True
            if self.is_moderator:
                c.from_moderator = True
            del c['_id']
            c = self.config.dbs.comments.save(c)
            p = self.config.dbs.proposals.get(p_id)
            p.comments.append(c._id)
            p = self.config.dbs.proposals.save(p)

            # send mails
            url = self.url_for("proposal_view", _full=True, seg_id = seg_id, p_id = p_id)
            comment = form['comment']


            # send mail to author if he's not the one commenting
            if str(self.user_id) != p.author:
                self.mail("comment_author", send_to=p.author_user.email, subject = self._(u"New comment"), url = url, comment = comment, author = p.author_user)

            # send mail to SR
            send_to = self.app.config.submit_emails
            if send_to:
                send_tos = [e.strip() for e in send_to.split(",")]
                for to in send_tos:
                    self.mail("comment_sr", send_to = to, subject = self._(u"New comment"), url = url, comment = comment)

            self.flash(self._(u"Comment posted successfully"), category="info")
        else:
            self.flash(self._(u"Please enter a comment"), category="warning")
        return redirect(self.url_for("proposal_view", seg_id=seg_id, p_id=p_id))


class MapComments(BaseHandler):
    """view for showing segment and editing proposals"""

    @asjson()
    def get(self, seg_id=None, p_id=None):
        """render the view"""
        p = self.config.dbs.proposals.get(p_id)
        return {'comments': p.mapcomments}
    post = get

class SubmitThankYou(BaseHandler):
    """thank you page for submitting"""

    template = "submit_success.html"

    @logged_in()
    def get(self, seg_id = None, p_id = None):
        """render the view"""
        return self.render(seg_id = seg_id)
