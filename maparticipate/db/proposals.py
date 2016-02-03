from mongogogo import *
import datetime

from maparticipate.segments import SEGMENTS


__all__=["Comment", "Comments", "Proposal", "Proposals", "MapComment", "MapComments"]


class WorkflowError(Exception):
    """error in workflow e.g. transition not allowed"""

    def __init__(self,
                 msg=u"Transition not allowed",
                 old_state=None,
                 new_state=None):
        """initialize the error with a message"""
        self.msg = msg
        self.old_state = old_state
        self.new_state = new_state

    def __str__(self):
        """return a printable representation"""
        return """<WorkflowError: %s (old=%s, new=%s)>""" \
               % (self.msg, self.old_state, self.new_state)


class CommentSchema(Schema):
    """a comment"""
    created         = DateTime()
    updated         = DateTime()
    author          = String() # user id
    workflow        = String(required = True, default = "public")

    comment         = String() # the acutal comment
    proposal        = String() # proposal this comment refers to

    # when to mark comments
    from_admin      = Boolean() # True if made by SR
    from_author     = Boolean() # True if made by author of the proposal
    from_moderator  = Boolean() # True if made by moderator

    # fields for geo locations, can be None if global comment
    location        = String() # in case it refers to a position, None otherwise
    icon            = String() # name if icon (can also be used for bridges etc.)

class Comment(Record):
    """a single comment by a normal user or admins (SR)"""

    schema = CommentSchema()

    default_values = {
        'created'       : datetime.datetime.utcnow,
        'updated'       : datetime.datetime.utcnow,
        'workflow'      : "public",
        'comment'      : "",
        'from_admin'    : False,
        'from_author'   : False,
        'location'      : None,
        'icon'      : None
    }

    workflow_states = {
        'public'   : ['deleted'],
        'deleted'  : ['public'] # not sure this is used much
    }

    @property
    def author_user(self):
        """return the author object"""
        return self._collection.md.app.module_map['userbase'].get_user_by_id(self.author)

    @property
    def author_name(self):
        user = self._collection.md.app.module_map['userbase'].get_user_by_id(self.author)
        return user.fullname

    def transaction_allowed(self, state):
        return state in self.workflow_states[self.workflow]

    def set_workflow(self, new_state):
        """set the workflow to a new state"""
        if not self.transaction_allowed(new_state):
            raise WorkflowError(old_state=self.workflow, new_state=new_state)
        self.workflow = new_state

  


class Comments(Collection):
    """comment collection"""

    data_class = Comment
    create_ids = True

    def by_proposal(self, proposal_id, workflow = ['public']):
        """return comments for a specific proposal

        :param proposal_id: The id of the proposal you want to retrieve comments for
        :param workflow: valid workflow states of comments to be returned or None to get all
        """

        q = {'proposal' : proposal_id}
        if workflow:
            if type(workflow) != type([]):
                workflow = [workflow]
            q['workflow'] = {'$in' : workflow}
        return self.find(q).sort("created", 1)

    @property
    def latest(self):
        """return the latest published comments"""
        return self.find({'workflow' : 'public'}).sort("created", -1).limit(3)



class ProposalSchema(Schema):
    """a proposal schema"""
    created         = DateTime()
    updated         = DateTime()

    author          = String() # user id
    workflow        = String(required = True, default = "draft")

    segment         = String() # "ac-la" etc. TODO: needs good naming or numbers

    description     = String() # description by author of route
    evaluation      = String() # description made by SR about the route

    route           = String() # geojson
    original        = String()

    comments        = List(String())
    mapcomments     = List(Dict(), default=[])


class Proposal(Record):
    """a proposal by a user for a specific segment of the complete route"""

    schema = ProposalSchema()

    default_values = {
        'created'       : datetime.datetime.utcnow,
        'updated'       : datetime.datetime.utcnow,
        'workflow'      : "draft",
        'description'   : "",
        'slug'          : "",
        'content'       : "",
        'layout'        : "default",
        'image'         : None,
        'mapcomments': [],
    }

    workflow_states = {
        'draft'       : ['published', 'deleted'],
        'published'   : ['deleted', 'finished'],
        'finished'    : ['deleted'],
        'deleted': [],
    }

    @property
    def author_name(self):
        user = self._collection.md.app.module_map['userbase'].get_user_by_id(self.author)
        return user.fullname

    @property
    def segment_name(self):
        return SEGMENTS[self.segment]['title']

    def owned_by(self, user):
        return unicode(user._id) == self.author

    def transaction_allowed(self, state):
        return state in self.workflow_states[self.workflow]

    def set_workflow(self, new_state):
        """set the workflow to a new state"""
        if not self.transaction_allowed(new_state):
            raise WorkflowError(old_state=self.workflow, new_state=new_state)
        self.workflow = new_state

    @property
    def author_user(self):
        """return the author object"""
        return self._collection.md.app.module_map['userbase'].get_user_by_id(self.author)



class Proposals(Collection):

    data_class = Proposal
    create_ids = True

    def before_serialize(self, obj):
        obj['updated'] = datetime.datetime.utcnow()
        return obj

    def by_userid(self, user_id, segment = None, workflow = None):
        """return proposals by a specific user

        :param user_id: id of the user to return proposals for
        :param segment: the segment for which proposals should be returned
            can be ``None`` in order to return all proposals by a user
        :param workflow: list of workflow states to return. ``None`` means all
        :return: list of matching proposals

        """
        q = {
            'author' : user_id
        }
        if segment:
            q['segment'] = segment
        if workflow:
            q['workflow'] = {'$in' : workflow}

        return self.find(q).sort("updated", -1)

    def by_segment(self, segment, workflow = None):
        """return proposals based on the segment and workflow

        :param segment: the segment for which proposals should be returned
        :param workflow: list of workflow states to return. ``None`` means all
        :return: list of matching proposals
        """
        q = {'segment' : segment}
        if workflow:
            q['workflow'] = {'$in' : workflow}

        return self.find(q)

    @property
    def latest(self):
        """return the latest published proposals"""
        return self.find({'workflow' : 'published'}).sort("updated", -1).limit(3)


class MapCommentSchema(Schema):
    """a comment to be put on a map"""
    created         = DateTime()
    updated         = DateTime()
    updated_string = String()
    author          = String() # user id
    author_name     = String() # user id
    workflow        = String(required = True, default = "public")

    comment         = String() # the acutal comment
    type         = String(default='comment') # the type, ususally 'comment'
    location        = List(Float()) # in case it refers to a position, None otherwise


class MapComment(Comment):
    """a single comment by a normal user on a map"""

    schema = MapCommentSchema()

    default_values = {
        'created'       : datetime.datetime.utcnow,
        'updated'       : datetime.datetime.utcnow,
        'workflow'      : "public",
        'comment'      : "",
        'location'      : None,
        'type': 'comment',
    }


class MapComments(Collection):
    """mapcomment collection"""

    data_class = MapComment
    create_ids = True

    def before_put(self, obj, data):
        """hook for handling additional validation etc."""
        if 'updated' in data:
            data['updated_string'] = data['updated'].strftime('%d.%m.%Y %H:%M')
        return data
