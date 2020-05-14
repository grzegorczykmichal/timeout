import React, { useState, useEffect, useRef } from "react";
import "./styles.css";
import { throttle } from "lodash";
import { combineReducers, createStore } from "redux";
import { Provider, connect } from "react-redux";

const SESION_DURATION = 6 * 1000;
const SESION_REFRESH_URATION = 6 * 1000;
const SESION_REFRESH_TIME_WINDOW = 1 * 1000;

const store = createStore(
  combineReducers({
    sessionWindowOpen: (state = false, action) => {
      if (action.type === "OPEN_WINDOW") {
        return true;
      }
      if (action.type === "CLOSE_WINDOW") {
        return false;
      }
      return state;
    },
    sessionExpired: (state = false, action) => {
      if (action.type === "EXPIRE") {
        return true;
      }
      if (action.type === "REFRESH") {
        return false;
      }
      return state;
    }
  }),
  {
    sessionExpired: false,
    sessionWindowOpen: false
  }
);

const SessionRefreshTimeWindow = ({ refreshSession }) => {
  useEffect(() => {
    const onMouseMove = function onMouseMove() {
      refreshSession();
      window.removeEventListener("mousemove", onMouseMove);
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [refreshSession]);

  return "window open";
};

const SessionTimeoutManager = connect(
  state => {
    return {
      isExpired: state.sessionExpired,
      isOpen: state.sessionWindowOpen
    };
  },
  (dispatch, getState) => {
    return {
      open: () => dispatch({ type: "OPEN_WINDOW" }),
      close: () => dispatch({ type: "CLOSE_WINDOW" }),
      refresh: () => dispatch({ type: "REFRESH" }),
      expire: () => dispatch({ type: "EXPIRE" })
    };
  }
)(({ isOpen, isExpired, open, close, refresh, expire }) => {
  if (isExpired) return "Expired";

  const timout = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        open();
      }, 1000);
    }
  }, [isOpen, open]);

  useEffect(() => {
    timout.current = setTimeout(() => {
      expire();
    }, 2000);
    return () => {
      clearTimeout(timout.current);
    };
  }, [expire, isOpen]);

  return isOpen ? (
    <SessionRefreshTimeWindow
      refreshSession={() => {
        clearTimeout(timout.current);
        close();
      }}
    />
  ) : null;
});

export default function App() {
  return (
    <Provider store={store}>
      <SessionTimeoutManager />
    </Provider>
  );
}
