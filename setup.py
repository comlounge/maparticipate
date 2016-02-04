from setuptools import setup, find_packages
import sys, os

version = '1.0'

"""
MaParticipate
-------------

MaParticipate is a tool capable of publically planning routes on a map. It can be used e.g.
in a public process (which it was developed for originally). Users are able to create and 
comment route proposals on different sub sections of a bigger route. 

"""

setup(name='maparticipate',
      version=version,
      description="Collaborative track proposal tool for eParticipation projects",
      long_description=__doc__,
      keywords='',
      author='COM.lounge',
      author_email='info@comlounge.net',
      url='',
      license='MIT',
      packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
      include_package_data=True,
      platforms='any',
      zip_safe=False,
      install_requires=[
        "starflyer",
        "markdown",
        "bleach",
        "PasteScript",
        "PasteDeploy",
        "Paste",
        "sf-babel",
        "sf-mail",
        "userbase",
        "pymongo",
        "mongogogo",
        "setuptools",
        "requests",
      ],
      classifiers=[
        'Development Status :: 4 - Beta',
        'Environment :: Web Environment',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.6',
        'Programming Language :: Python :: 2.7',
      ],
      entry_points='''
          [paste.app_factory]
          main = maparticipate.app:app
      ''',
      )
