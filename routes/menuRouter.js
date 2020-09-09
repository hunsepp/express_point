const express = require('express');
const router = express.Router();
const Menu = require('../model/Menu');

// 메뉴 등록
router.post('/', (req, res) => {
    const menu = new Menu();
    menu.store = req.body.id;
    menu.name = req.body.name;
    menu.price = req.body.price;

    menu.save(err => {
        if(err) res.json({result: 0, error: err});
        else res.json({result: 1});
    });
})

// 메뉴 목록
router.get('/:id', (req, res) => {
    Menu.find({store: req.params.id})
    .populate('store')
    .exec((err, menus) => {
        if(err) res.json({result: 0, error: err});
        else res.json({result: 1, menus});
    })
})

// 메뉴 삭제
router.delete('/:id', (req, res) => {
    Menu.deleteOne({_id: req.params.id}, (err, output) => {
        if(err) res.json({result: 0, error: err});
        else res.json({result: 1});
    })
})

module.exports = router;