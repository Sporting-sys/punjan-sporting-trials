const express=require("express")
const multer=require("multer")
const sqlite3=require("sqlite3").verbose()
const nodemailer=require("nodemailer")
const QRCode=require("qrcode")
const cors=require("cors")

const app=express()

app.use(express.json())
app.use(cors())
app.use(express.static("public"))

const upload=multer({dest:"uploads/"})

const db=new sqlite3.Database("players.db")

db.run(`
CREATE TABLE IF NOT EXISTS players(
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT,
age TEXT,
position TEXT,
phone TEXT,
email TEXT,
video TEXT,
score INTEGER,
qr TEXT
)
`)

const transporter=nodemailer.createTransport({
service:"gmail",
auth:{
user:"YOUR_EMAIL@gmail.com",
pass:"YOUR_APP_PASSWORD"
}
})

function aiScout(position,age){

let score=50

if(age<18) score+=20
if(position=="Striker") score+=15
if(position=="Midfielder") score+=10
if(position=="Defender") score+=8

return score

}

app.post("/register",upload.single("video"),async(req,res)=>{

const {name,age,position,phone,email}=req.body

const video=req.file.filename

const score=aiScout(position,age)

const qrData=`${name}-${phone}`

const qr=await QRCode.toDataURL(qrData)

db.run(
"INSERT INTO players(name,age,position,phone,email,video,score,qr) VALUES(?,?,?,?,?,?,?,?)",
[name,age,position,phone,email,video,score,qr]
)

const mailOptions={
from:"Punjab Sporting",
to:email,
subject:"Punjab Sporting Trials Confirmation",
html:`
<h2>Punjab Sporting Trials</h2>

<p>Hello ${name}</p>

<p>Your registration is confirmed.</p>

<p><b>Venue:</b> Imphal Main Stadium</p>

<p>Show this QR code at entry:</p>

<img src="${qr}" width="200"/>

`
}

transporter.sendMail(mailOptions)

res.send({success:true,qr})

})

app.get("/players",(req,res)=>{
db.all("SELECT * FROM players",(err,rows)=>{
res.send(rows)
})
})

app.get("/shortlist",(req,res)=>{
db.all("SELECT * FROM players WHERE score>70",(err,rows)=>{
res.send(rows)
})
})

app.listen(3000,()=>{
console.log("Server running on port 3000")
})