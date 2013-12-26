/**
 * Created by svalmiki on 12/25/13.
 *
 * Creates a threaded discussion platform
 *
 * Resources: http://unicorn.wmflabs.org/techtask/discussion.json
 *
 */
var data;
//dictionary to save all responses
var respDict = new Array();
//dictionary to save responses that are not in order (parent is yet to be found)
var futureAssg = new Array();
var maxId = 0;
var replyTopicId = 0;
var replyParentId = 0;
var replyId = 0;
var replyDepth = 0;
var currTopic = 0;
var totalTopics = 0;
/**
 * Creates a response element
 * @param response
 * @param topicId
 * @returns {void|*|append}
 */
function getResponse(response, topicId){

    var resp = jQuery("<div></div>", {
        class: "response-container"
    })
        .append(jQuery("<div></div>",{
            class: "vertical-line",
            html:"&nbsp;"
        }))
        .append(jQuery("<div></div>",{
            class:"spacer"
        }))
        .append(jQuery("<p></p>",{
            class:"author",
            text: "Author: "+response.author
        }))
        .append(jQuery("<div></div>",{
            class:"response-content",
            html: response.posttext
        }))
        //a loaded button id is used to track data for each response that will come in handy to place the replies in the
        // right place
        .append(jQuery("<button></button>",{
            id: "reply_"+topicId+"_"+response.parentid+"_"+response.depth+"_"+response.id,
            class:"btn response",
            text:"Reply"
        }));
    if(maxId<response.id){
        maxId = response.id;
    }
    //saves all responses in a dictionary
    respDict[response.id] = resp;
    return resp;
}
/**
 * Creates all responses for the topic.
 * @param topic
 * @param topicId
 * @returns {window.jQuery|*}
 */
function getResponses(topic,topicId){
    var responses = jQuery("<div></div>",{
        class: "topic-container"
    });
    //This button is used to store responses for the topic (they are not replies to any response)
    responses.append(jQuery("<button></button>",{
        id: "reply_"+topicId+"_"+0+"_"+0+"_"+0,
        class:"btn response",
        text:"Respond"
    }))
    topic.responses.forEach(function(response){
        //if the depth of a response is 0, it is a response to the topic and not a reply
        if(response.depth == 0){
            responses.append(getResponse(response,topicId));
        }
        else{
            //if responses are not in order
            if(typeof respDict[response.parentid] == 'undefined')
                futureAssg[response.parentid] = getResponse(response,topicId);
            else
                respDict[response.parentid].append(getResponse(response,topicId));
        }
    });
    //sets the responses in order
    for(var key in futureAssg){
        respDict[key].append(futureAssg[key]);
    }
    return responses;
}
/**
 * Builds a topic
 * @param topic
 * @param id
 */
function buildTopic(topic,id){
    var topicId = "topic_"+id;

    jQuery('<div></div>', {
        id: "topic_" + topicId,
        class: "topics"
    }).appendTo('.container')
        .append(jQuery('<h3></h3>',{
            class:"topic",
            text:topic.topictitle
        }))
        .append(getResponses(topic,id));
}
/**
 * Renders all topics and conversation about the topic
 */
function render(){
    var id = 0;
    $('.topics').remove();
    data.topics.forEach(function(topic){
        buildTopic(topic, id);
        ++id;
    });
}

function renderOne(){
    var id = 0;
    $('.topics').remove();
    buildTopic(data.topics[currTopic],currTopic);
}

$(function(){
    $("#resp").hide();
    $("#previous").hide();
    $("body").on("click","#next",function(event){
        if(currTopic+1 < totalTopics-1){
            ++currTopic;
            renderOne();
            $("#previous").show();
        }
        else if(currTopic+1 == totalTopics-1){
            ++currTopic;
            renderOne();
            $("#previous").show();
            $("#next").hide();
        }

    })
    $("body").on("click","#previous",function(event){
        if(currTopic-1 > 0){
            --currTopic;
            renderOne();
            $("#next").show();
        }
        else if(currTopic-1 == 0){
            $("#previous").hide();
            --currTopic;
            renderOne();
            $("#next").show();
        }
    })
    /**
     * On click of the response buttons (Reply/Response), parses the id to store the different parts to the
     * global variables to use while saving the response
     */
    $("body").on("click",".response",function(event){
        var ids = event.target.id.split("_");
        replyTopicId = ids[1];
        replyParentId = ids[2];
        replyDepth = ids[3];
        replyId = ids[4];
        $('#resp').show();
    });
    /**
     * On click of the Okay button for the response, saves the response in the appropriate topic under the
     * appropriate response (if it is a reply)
     */
    $("body").on("click","#ok",function(event){
        if($('#resp-text').val().trim() != ""){
            if(replyId != 0){
                ++replyDepth;
            }
            var res = {
                id:++maxId,
                parentid:replyId,
                depth:replyDepth,
                //ignoring age for now
                age:99999,
                author:"LoggedInUser",
                posttext:$('#resp-text').val()
            };
            //Push response into the correct topic
            data.topics[replyTopicId].responses.push(res);

            //code to push to server here:

            $('#resp').hide();
            $('#resp-text').val("");
            //Refresh
            renderOne();
        }
    })
    /**
     * On click of cancel button hides and clears response popup
     */
    $("body").on("click","#cancel",function(event){
        $('#resp').hide();
        $('#resp-text').val("");
    });
    //Gets data from data.json.
    $.ajax({
        type: "GET",
        url: "data.json",
        success:function(res){
            data = res;
            totalTopics = data.topics.length;
            currTopic = 0;
            renderOne();

        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status);
            alert(thrownError);
        }
    });
});

