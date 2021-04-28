import React, { useState, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Dropdown,
  Flex,
  Icon,
  Tabs,
  Tooltip,
  Navbar,
} from './components';
import firebase from './firebase';
import 'firebase/auth';
import 'firebase/functions';

import AppContext from './AppContext';
import SwordInstaller from './SwordInstaller';
import BookOpener from './BookOpener';
import BookSelecter from './BookSelecter';
import canon_jp from './sword/canons/locale/ja.json';
import './App.css';

const AppBar: React.FC = () => {
  const [value, setValue] = useState('0');
  const [opener, setOpener] = useState<'installer' | 'selector' | null>(null);
  const { bibles, layouts, currentUser, customClaims } = useContext(AppContext);
  const canonjp: { [key: string]: { abbrev: string; name: string } } = canon_jp;
  const emptyBibles = Object.keys(bibles).length === 0;
  const emptyLayout = layouts?.length === 0;
  const bible_file = useRef<HTMLInputElement>(null);
  const dict_file = useRef<HTMLInputElement>(null);
  const morph_file = useRef<HTMLInputElement>(null);
  const references = useRef<HTMLInputElement>(null);
  const admin = customClaims?.role === 'admin';

  const handleChange = (newValue: string) => {
    setValue(newValue);
  };

  const logout = () => {
    if (window.confirm('ログアウトしますか？')) {
      firebase
        .auth()
        .signOut()
        .then(function () {
          // Sign-out successful.
        })
        .catch(function (error) {
          // An error happened.
          alert('エラーが発生しました。');
          console.log({ error });
        });
    }
  };

  const getAuthUser = () => {
    if (currentUser) {
      const uid = window.prompt('input uid');
      const func = firebase
        .app()
        .functions('asia-northeast1')
        .httpsCallable('getAuthUser');
      func({ uid })
        .then((result) => {
          console.log({ result });
          alert('データを取得しました。');
        })
        .catch((error) => {
          console.log({ error });
          alert(error.message || 'エラーが発生しました。');
        });
    }
  };

  return (
    <Navbar fixed className="bg-gray-100 flex justify-between h-12">
      <Flex>
        <img src="j-sword.png" className="h-10 mx-2 my-1 hidden sm:block" />
        <Tabs
          value={value}
          variant="line"
          size="sm"
          baseLine={false}
          onChange={handleChange}
          className="mx-1"
        >
          <Tabs.Tab
            label="聖書"
            // icon={<Icon name="fire" variant="solid" className="text-red-400" />}
            icon={<img src="volume.png" className="w-5 h-5" />}
            value="0"
          />
          <Tabs.Tab
            label="真理"
            // icon={<Icon name="lightning-bolt" className="text-yellow-400" />}
            icon={<img src="truth.png" className="w-5 h-5" />}
            value="1"
          />
        </Tabs>
        <Tooltip title="モジュールダウンロード" className="text-left">
          <Button
            variant="icon"
            size="sm"
            color="none"
            onClick={() => setOpener('installer')}
            className="mx-1 my-2 text-gray-500 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300"
          >
            <Icon name="cloud-download" />
          </Button>
        </Tooltip>
        <Tooltip title="画面追加">
          <BookSelecter
            trigger={
              <Button
                variant="icon"
                size="sm"
                color="none"
                className="mx-1 my-2 text-gray-500 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300"
              >
                <Icon name="document-add" />
              </Button>
            }
          />
        </Tooltip>
        <BookOpener
          trigger={
            <Button
              variant="icon"
              size="none"
              color="none"
              className="absolute top-0 left-0 text-gray-500 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300 z-10 w-6 h-6 p-0.5 m-1"
            >
              <Icon name="book-open" />
            </Button>
          }
          className="mx-2"
        />
      </Flex>
      <Flex>
        {currentUser ? (
          <Dropdown
            icon={
              <Button
                variant="icon"
                size="sm"
                color="none"
                className="m-2 text-gray-500 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300"
              >
                <Icon name="dots-vertical" />
              </Button>
            }
            align="right"
          >
            <Dropdown.Item
              title={
                <div className="m-1 font-medium text-gray-600">
                  {currentUser?.displayName && currentUser.displayName}
                  {currentUser?.email && (
                    <p className="text-sm">{currentUser.email}</p>
                  )}
                </div>
              }
            />
            <Dropdown.Divider />
            <Dropdown.Item title="ログアウト" onClick={logout} />
          </Dropdown>
        ) : (
          <Link to="/sign_in">
            <Tooltip title="ログイン">
              <Button
                variant="icon"
                size="sm"
                color="none"
                className="m-2 text-gray-500 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300"
              >
                <Icon name="login" />
              </Button>
            </Tooltip>
          </Link>
        )}
      </Flex>
      <SwordInstaller
        open={opener === 'installer'}
        onClose={() => setOpener(null)}
      />
    </Navbar>
  );
};

export default AppBar;
