#encoding=utf8

import datetime
import pymongo
import json
import functools

from starflyer.decorators import asjson
from starflyer import redirect

from maparticipate.framework import BaseHandler
from maparticipate.decorators import logged_in


class IndexView(BaseHandler):
    """an index handler"""

    template = "index.html"

    def get(self):
        """render the view"""
        proposals = self.config.dbs.proposals.latest
        comments = list(self.config.dbs.comments.latest)
        new_comments = []
        for c in comments:
            c.p = self.config.dbs.proposals.get(c.proposal)
            new_comments.append(c)
        return self.render(
            proposals = proposals,
            comments = new_comments,
        )


class CommentOverview(BaseHandler):
    """an index handler"""

    template = "comment_overview.html"

    def get(self):
        """render the view"""
        return self.render()

    @logged_in()
    @asjson()
    def post(self):
        """render the view"""
        form = self.request.form
        if form.has_key("mapcomments"):
            received_ids = []
            for data in json.loads(form['mapcomments']):
                data['author'] = unicode(self.user._id)
                data['author_name'] = self.user.fullname
                if '_id' not in data.keys():
                    if 'created' in data:
                        del data['created']
                    if 'updated' in data:
                        del data['updated']
                    comment = self.config.dbs.mapcomments.create()
                    del comment['_id']
                    comment.update(data)
                    comment = self.config.dbs.mapcomments.save(comment)
                    received_ids.append(comment['_id'])
                else:
                    received_ids.append(data['_id'])
            saved_ids = self.config.dbs.mapcomments.find().distinct('_id')
            for sid in saved_ids:
                if sid not in received_ids:
                    to_delete = self.config.dbs.mapcomments.get(sid)
                    self.config.dbs.mapcomments.remove(to_delete)
            return {'status': 'OK'}
        return {'status': 'FAIL'}


class MapComments(BaseHandler):
    """view for showing segment and editing proposals"""

    @asjson()
    def get(self):
        """render the view"""
        return {
            'comments': list(self.config.dbs.mapcomments.find()),
            'edit': self.logged_in,
        }
    post = get


class Impressum(BaseHandler):
    """show the impressum"""

    template = "impressum.html"

    def get(self):
        """render the view"""
        return self.render()

