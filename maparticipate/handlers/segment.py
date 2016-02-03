#encoding=utf8

import datetime
import pymongo
import json
from operator import itemgetter

from starflyer import redirect
from userbase.decorators import logged_in

from maparticipate.framework import BaseHandler


class SegmentOverview(BaseHandler):
    """choose a segment to edit or comment on"""

    template = "segment_overview.html"

    def get(self):
        """render the view"""
        proposals = {}
        segments=sorted(
            self.config.segments.values(),
            key=itemgetter('id'), reverse = False
        )
        for s in segments:
            proposals[s['id']] = self.config.dbs.proposals.by_segment(
                s['id'],
                ['published']
            ).count()
        return self.render(
            segments=segments,
            proposals=proposals
        )


class SegmentView(BaseHandler):
    """view for showing segment and editing proposals"""

    template = "segment_view.html"

    def get(self, seg_id=None):
        """render the view"""
        seg = self.config.segments[seg_id]
        if self.logged_in:
            own_proposals = list(self.config.dbs.proposals.by_userid(self.user_id, segment = seg_id, workflow=['published', 'draft']))
        else:
            own_proposals = []
        own_proposal_ids = [str(p._id) for p in own_proposals]
        proposals = [p for p in self.config.dbs.proposals.by_segment(seg_id, ['published']) if str(p._id) not in own_proposal_ids]
        can_propose = len(own_proposals) < 3

        return self.render(
            seg = seg,
            can_propose = can_propose,
            proposals = list(proposals),
            own_proposals = own_proposals
        )
    post = get
