# StudyBuddy Tutor
The porpuse of this bot is helping university students through their journy in the university, giving help in managing time, studying and more.

This bot can do many things that can be devided in two categories, AI and non-AI.


## AI

### chat 
send a message and your ai assistant will respond to you as a study tutor, the bot forward the message to the [cheshire cat](https://cheshire-cat-ai.github.io/docs/) and get the response and send it back to the user. there is also a [plugin](https://github.com/studybuddydev/studybuddy-cat-plugin/blob/main/studybuddy.py) in the cat that tells the assistant to behave as a study tutor. you can find this in the chat.ts 

### generate images
uses dall-e to generate images, you can find this in the ai.ts, usage /image <text>


### understand images 
you can send a picture with a caption and the bot will try to understand the image and give you a response, you can find this in the ai.ts

### transcript audio and postprocess it 
you can send an audio file and the bot will transcript it and postprocess it, you can find this in the ai.ts and chat.ts, if the file is long it will compress it and will send the text in a separate file instead of a message 


