#  WELCOME TO MediTrack 
# The frontend will be built in next.js while the backend will consist of python and boto3 and AWS Lambda
# As of the infrasturcture we will use AWS cdk

# The application basically consist of 3 main folders(first made) :
 Backend , Frontend and Infrastructure.

 The Frontend folder will consist of a next js app (which will be the user's entry point view of the system) 
 # frontend commands 
 -- npx create-next-app@latest frontend
 -- npm run dev
 

 The Backend will hold the lambda functions and we'll set up the python environment there too
 # backend commands
 -- python -m venv .venv
 -- .venv\Scripts\activate
 -- python  -m pip install --uprade pip
 
 The Infrastructure will hold our stack and constructs.
 # infrastructure commands
 -- cdk init app --language python
 -- python -m venv .venv
 -- .venv\Scripts\activate
 -- python -m pip install -r requirements.txt
 -- cdk bootstrap // to set up cdk environment on aws account 
 -- cdk list // to view the stacks present
 -- cdk synth
 -- cdk diff // To view the changes made so far before deployment

# Connect frontend with aws amplify(note we are not usign Gen2 , we are just using Amplify for the libraries it provides )
# On a different terminal :
-- cd frontend
-- npm install aws-amplify // to install the client library used to communicate with cognito
# create a file (.env.local ) in the frontend folder and include environments variables like user pool and client ID


