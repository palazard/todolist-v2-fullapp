const express = require('express');
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended:false}));
app.use(express.static("public"));

async function main() {
  await mongoose.connect(`mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PW}@cluster0.d4wx6lk.mongodb.net/todolist?retryWrites=true&w=majority`, {useNewUrlParser: true,});
  //   await mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');
}
main().catch(err => console.log(err));

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
      }
  });

const Item = mongoose.model('Item', itemSchema);

const item1 = new Item({ name: 'Appeller Maman' });
const item2 = new Item({ name: 'Faire les courses' });
const item3 = new Item({ name: 'Gym' });

const defaultItems = [item1, item2, item3];


const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
});

const List = mongoose.model('List', listSchema);


app.get('/', (req, res) => {
    Item.find()
        .then(result=>{
            if (result.length===0) {
                Item.insertMany(defaultItems)
                    .then(res => res.redirect('/'))
                    .catch(err=>console.log(err));
            } else {
                res.render('list', {listTitle : "Today", newItems : result});
            }
        })
        .catch(err => console.log(err));
});


app.get('/:customListTitle', (req, res) => {
    const customListTitle = req.params.customListTitle;
    List.findOne({name: customListTitle})
        .then(result=>{
            if (!result) {
                const list = new List ({
                    name: customListTitle,
                    items: defaultItems
                });
                list.save();
                res.redirect(`/${customListTitle}`);
            } else {
                res.render('list', {listTitle : result.name, newItems : result.items});
            }
        })
        .catch(err => console.log(err));
})

app.get('/about', (req, res)=>{
    res.render('about');
})

app.post('/', (req, res) => {
    const newItem = new Item({ name: req.body.newItem });
    if (req.body.list === 'Today'){
        newItem.save();
        res.redirect('/');
    } else {
        //other option:
        // List.findOne({name: req.body.list})
        //     .then(result=>{
        //         result.items.push(newItem);
        //         result.save();
        //         res.redirect(`/${req.body.list}`);  
        //     })
        //     .catch(err => console.log(err));
        List.findOneAndUpdate(
                {name: req.body.list}, 
                {$push: {items:newItem}}
            )
            .then(result=>{
                res.redirect(`/${req.body.list}`);  
            })
            .catch(err => console.log(err));
    }
});

app.post('/delete', (req, res) => {
    if(req.body.listTitle==="Today"){
        Item.findByIdAndRemove(req.body.checkbox)
            .then(result=> res.redirect('/'))
            .catch(err=>console.log(err));
    } else {
        List.findOneAndUpdate(
                {name: req.body.listTitle},
                {$pull: {items:{_id:req.body.checkbox}}}
            )
            .then(result=> {
                res.redirect(`/${req.body.listTitle}`);
            })
            .catch(err=>console.log(err));
        //other option:
        // List.findOne({name: req.body.listTitle})
        //     .then(result=> {
        //         result.items.pull({_id:req.body.checkbox});
        //         result.save();
        //         res.redirect(`/${req.body.listTitle}`);
        //     })
        //     .catch(err=>console.log(err));
    }
    
})


app.listen(3000, function(){
    console.log("Server starting on port 3000")
})
