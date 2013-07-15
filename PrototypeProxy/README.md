eCourses/SanVan PAF Proxy with a rough eCourses/SanVan player.

To run this, drop this in your tomcat webapps directory and fire up tomcat.  It will only run on localhost:8080, so...
http://localhost:8080/ecourses-paf-proxy/jsp/paflaunchmulti.jsp

A few things:

* The back end is a web archive of the ecourses-paf-proxy work in http://subversion.pearsoncmg.com/data/ecourses.
Just grabbing the code out of SVN won't do it for you, as there are some local maven dependencies that need to be
setup on your machine.  The eCourses team is working on documenting that.  In the meantime, the web archive, as 
provided here, works pretty well.

* Everything starts with an assignment_guid.  This is passed out to PAF through this proxy and the proxy collects all
'activities' associated with that assignment.  In this prototype each activity is fed into a player on the page in 
turn...the page doesn't dictate which activity it wants to see (that'll come later).  You could, if you wanted, 
create four divs (commented out at bottom of jsp/paflaunchmulti.jsp), reference those four divs when you initialize around
L149, monkey with the css at the top of the page to make those four divs fit, and if you have at least four activities in your
assignment they will populate multiple iframes.  I just stuck with one for this NeffReactor example.

* Neff isn't an assessment activity.  It doesn't POST anything to PAF.  My understanding from the rest of the eCourses team was
that they were having trouble with assessments in general and were working through those issues.

* Here's the general order of things...
1. jsp/paflaunchmulti.jsp does an LTI launch to PAF, sending the assignment_guid, and PAF loads up the proxy will all of the
activities associated with the assignment.  (there are details here that the rest of the eCourses team could fill in).
2. The player is initialized, with js/mutlipafam.js doing the heavy lifting.  It assumes that it will get a player reference
from PAF and load that into an iFrame that it'll throw into the div at the bottom of the paflaunchmulti.jsp page.  This isn't
absolutely in line with how the Brix team is thinking about things but this still illustrates Brix content in PAF so we forge
ahead.  The "player" that the Brix team cares about is jsp/sanvanIframePlayerv1.jsp.  This gets loaded into the iFrame.
3. jsp/sanvanIframePlayerv1.jsp has the NeffReactor text hardcoded into it.  Ignore that.  Once it loads it sends an html5
post message back to mutlipafam.js saying it's ready for content.  mutlipafam.js then sends the RichSequenceNode down to the 
player.
4. The player takes the Node and inits the internal activity manager (js/inframe-activitymanager.js).  This doesn't do much other 
than creating an eventManager and initializing the interactives (old term for Brix).
5. The interactives code rips down through the RichSequenceNode from PAF and turns that config into the NeffReactor.
6. The player then sends a SequenceNodeLoaded postMessage back to the mutlipafam.js which displays the iframe.
 