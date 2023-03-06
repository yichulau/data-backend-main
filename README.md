# cryptodashboard-backend-main
cryptodashboard-backend-main
# For localhost/local enviroment Steps:
- Make a copy of .env.example
- Fill in db info
- npm install
- Run serve: node build/index.js
- new Tab:
- Run collection: node build/sync/index.js

# For deploy to server/cloud in aws/gcp:

**To Setup if its a Clean installation:**

**Install Node and NPM: **

Step 1:
curl -fsSL https://deb.nodesource.com/setup_17.x | sudo -E bash -

Step2:
sudo apt update -y

Step3:
do apt install nodejs -y

**Upload backend source code to server:**

Step 1:
Use FTP clinet such as filezilla to upload backend to the server

Step 2: 
After upload then unzip the file.
unzip xxxxx_backend.zip

Step 3:
Change directory to the folder

Step 4:
type this command: npm install

Step 5: configure env variable
vi ~/.bashrc

- Add these lines to the bashrc file, credentials is shared privately

- export PORT="3001"
- export DB_HOST="xxxxx"
- export DB_USER="xxxxx"
- export DB_PASSWORD="xxxxx"
- export DB_SCHEMA="xxxxxxx

![Screenshot 2023-03-06 173316](https://user-images.githubusercontent.com/39252336/223076491-0072bd0a-a535-4dc7-9daa-e7a2dae34093.png)

- Save and exit the file, then do a
source ~/.bashrc

Step 6: 
execute this command in current directory:
npm install -g pm2

Step 7:
Run these command:
pm2 start build/index.js --name apiserver
pm2 start build/sync/index.js --name websocket-cron

Step 8:
You can test by opening your browser and input this sample address 

instance_ip = EC2/vm external IP
sample:
https://{instance_ip}/api/v1.0/btc/binance/option-chart


--end
