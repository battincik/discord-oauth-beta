// Initalization
const express = require('express');
const config = require('./config.json'); // Website config
const FormData = require('form-data');
const fetch = require('node-fetch');
const app = express();
app.use(require('express-session')(config.session))

app.get('/', async (req, resp) => {
    if(!req.session.bearer_token)
        return resp.redirect('/login') // Redirect to login page
    
    const data = await fetch(`https://discord.com/api/users/@me`, {headers: { Authorization: `Bearer ${req.session.bearer_token}` } }); // Fetching user data
    const json = await data.json();

    if(!json.username) // This can happen if the Bearer token has expired or user has not given permission "indentity"
        return resp.redirect('/login') // Redirect to login page

    resp.send(`<h1>Hello, ${json.username}#${json.discriminator}!</h1>` +
              `<img src="https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}?size=512">`) // Show user's nametag and avatar
})

app.get('/login/callback', async (req, resp) => {
    const accessCode = req.query.code;
    if (!accessCode) // If something went wrong and access code wasn't given
        return resp.send('No access code specified');

    // Creating form to make request
    const data = new FormData();
    data.append('client_id', config.oauth2.client_id);
    data.append('client_secret', config.oauth2.secret);
    data.append('grant_type', 'authorization_code');
    data.append('redirect_uri', config.oauth2.redirect_uri);
    data.append('scope', 'identify');
    data.append('code', accessCode);

    // Making request to oauth2/token to get the Bearer token
    const json = await (await fetch('https://discord.com/api/oauth2/token', {method: 'POST', body: data})).json();
    req.session.bearer_token = json.access_token;

    resp.redirect('/'); // Redirecting to main page
});

app.get('/login', (req, res) => {
    // Redirecting to login url
    res.redirect(`https://discord.com/api/oauth2/authorize` +
                 `?client_id=${config.oauth2.client_id}` +
                 `&redirect_uri=${encodeURIComponent(config.oauth2.redirect_uri)}` +
                 `&response_type=code&scope=${encodeURIComponent(config.oauth2.scopes.join(" "))}`)
})

// Starting our application
app.listen(config.port || 80, () => {
    console.log(`Listening on port ${config.port || 80}`)
});