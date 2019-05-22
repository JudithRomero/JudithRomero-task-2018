import * as React from 'react'
import { NavLink } from 'react-router-dom'


export default class NotFound extends React.Component {
  render() {
    return <React.Fragment>Not found, return to <NavLink to="/">main page</NavLink></React.Fragment>
  }
}
