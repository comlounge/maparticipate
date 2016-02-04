# MapParticipate

MaParticipate is a tool capable of publically planning routes on a map. It can be used e.g.
in a public process (which it was developed for originally). Users are able to create and 
comment route proposals on different sub sections of a bigger route. 

## Requirements

You need the following to run MaParticipate:

- Python 2.7
- MongoDB 3.x
- virtualenv


## Installation and running

Setup a virtual environment and clone the repository (or your fork):

    virtualenv . 
    git clone https://github.com/mrtopf/maparticipate.git

Now run the setup:
  
    cd maparticipate
    python setup.py develop
  
Now create a directory for your configuration file and copy over the sample one:
  
    cd ..
    mkdir etc
    cp maparticipate/contrib/dev.ini etc/
  
You might want to edit the file and esp. you want to get a mapbox API key from https://mapbox.com and put it in there. (usually starts with `pk.`)
Also make sure you set the domain correctly as `localhost` will not work because most browser these days refuse to store cookies on it so you cannot login. So better setup a virtual host on your web server. 

To start it you can run it via paster:

    bin/paster serve etc/dev.ini 

You should then be able to visit the website on port 9876 (or whatever virtual host you used). 
  
## Creating an admin

It's good to have admins as they can moderate comments and routes. In order to create one you first need to create a user (in case you haven't via the service itself):

    bin/um -f etc/dev.ini add <username> <email> <password>
  
Please not that you have to type in the password on the command line that way, you maybe want to change it afterwards. 

The user will automatically be activated. Also note that this will only work if the application is not in debug mode which you can disable in the config.

In order to set roles for the user you can use the following command:

    bin/um -f etc/dev.ini permissions <username> admin

Now this user can delete routes and comments. Her or his Comments will be marked as "Moderator". 

The username usually will be the lower case filename version of the fullname, e.g. "Christian Scholz" will become `christian_scholz`. 





