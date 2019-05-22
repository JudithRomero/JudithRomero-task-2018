import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Search from './pages/Search'
import Tag from './pages/Tag'
import Scene from './pages/Scene'
import NotFound from './pages/NotFound'


const App = () => <BrowserRouter>
  <Switch>
    <Route exact path="/" component={Search} />
    <Route path="/tag/:tagName" component={Tag} />
    <Route path="/scene/:sceneId" component={Scene} />
    <Route path="/register" component={Register} />
    <Route path="/login" component={Login} />
    <Route path="*" component={NotFound} />
  </Switch>
</BrowserRouter>

ReactDOM.render(<App />, document.getElementById('app'))
