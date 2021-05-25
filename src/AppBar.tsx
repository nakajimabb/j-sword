import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Dropdown,
  Flex,
  Form,
  Icon,
  Navbar,
  Pagination,
  Tooltip,
} from './components';
import firebase from './firebase';
import 'firebase/auth';
import 'firebase/functions';

import AppContext from './AppContext';
import SwordInstaller from './SwordInstaller';
import BookForm from './BookForm';
import BookOpener from './BookOpener';
import BookSelecter from './BookSelecter';
import canon_jp from './sword/canons/locale/ja.json';
import { OsisLocation } from './sword/types';
import SettingDB from './SettingDB';
import './App.css';
import clsx from 'clsx';

const canonjp: { [key: string]: { abbrev: string; name: string } } = canon_jp;

const bookDictIndex = (
  locations: { [modname: string]: OsisLocation },
  modname: string,
  book: string
) => {
  let indexes = [];
  const book_indexes = ((locations || {})[modname] || {})[book];
  for (let chapter in book_indexes) {
    for (let verse in book_indexes[chapter]) {
      indexes.push(`${book}.${chapter}:${verse}`);
    }
  }
  return indexes;
};

const countByModname = (locations: { [modname: string]: OsisLocation }) => {
  let sum: { [modname: string]: { [book: string]: number } } = {};
  for (let modname in locations) {
    if (modname !== 'lemma') {
      sum[modname] = countByBook(modname, locations);
    }
  }
  return sum;
};

const countByBook = (
  modname: string,
  locations: {
    [modname: string]: OsisLocation;
  }
) => {
  let sum: { [book: string]: number } = {};
  for (let book in locations[modname]) {
    for (let chapter in locations[modname][book]) {
      if (!sum.hasOwnProperty(book)) sum[book] = 0;
      for (let verse in locations[modname][book][chapter]) {
        sum[book] += locations[modname][book][chapter][verse];
      }
    }
  }
  return sum;
};

const AppBar: React.FC = () => {
  const [opener, setOpener] =
    useState<'installer' | 'selector' | 'book-form' | null>(null);
  const [wordTarget, setWordTarget] = useState('');
  const [osisOptions, setOsisOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [page, setPage] = useState<{ current: number; count: number }>({
    current: 0,
    count: 0,
  });
  const [settingNames, setSettingNames] = useState<string[]>([]);
  const {
    bibles,
    layouts,
    currentUser,
    customClaims,
    interlocked,
    setInterlocked,
    targetHistory,
    osisLocations,
    setTargetOsisRefs,
    saveSetting,
    loadSetting,
    updateTargetHistory,
  } = useContext(AppContext);
  const emptyBibles = Object.keys(bibles).length === 0;
  const emptyLayout = layouts?.length === 0;
  // const bible_file = useRef<HTMLInputElement>(null);
  // const dict_file = useRef<HTMLInputElement>(null);
  // const morph_file = useRef<HTMLInputElement>(null);
  // const references = useRef<HTMLInputElement>(null);
  const admin = customClaims?.role === 'admin';
  // const manager = admin || customClaims?.role === 'manager';
  const enablePrev = targetHistory.currentIndex > 0;
  const enableNext =
    targetHistory.currentIndex < targetHistory.history.length - 1;
  const count_per_page = 10;
  const mode = targetHistory.current()?.mode;

  useEffect(() => {
    const counts = countByModname(osisLocations);
    const location_options = Object.keys(osisLocations)
      .map((modname: string) =>
        Object.keys(osisLocations[modname]).map((book) => ({
          mod_key: modname,
          book,
        }))
      )
      .flat(1)
      .filter((di) => di.mod_key !== 'lemma');
    const options = location_options.map((option) => ({
      label: `${canonjp[option.book].abbrev}(${option.mod_key})  x${
        counts[option.mod_key][option.book]
      }`,
      value: `${option.mod_key}:${option.book}`,
    }));
    setOsisOptions(options);

    if (options.length > 0) {
      const value = options[0].value;
      setWordTarget(value);
      const [modname, book] = value.split(':');

      const indexes = bookDictIndex(osisLocations, modname, book);
      const pageCount = Math.ceil(indexes.length / count_per_page);
      setPage({ current: 1, count: pageCount });

      setTargetOsisRefs(indexes.slice(0, count_per_page));
    }
  }, [osisLocations, setTargetOsisRefs]);

  useEffect(() => {
    updateSettingNames();
  }, []);

  const updateSettingNames = async () => {
    const names = await (
      await SettingDB.settings.where('name').notEqual('&last').toArray()
    ).map((s) => s.name);
    setSettingNames(names);
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

  const setCustomUserClaims = async () => {
    if (currentUser) {
      const uid = window.prompt('input uid');
      if (uid) {
        try {
          const func = firebase
            .app()
            .functions('asia-northeast1')
            .httpsCallable('saveCustomClaims');

          const result = await func({ uid, customClaims: { role: 'manager' } });
          console.log({ result });
          alert('登録しました。');
        } catch (error) {
          console.log({ error });
          alert(error.message || 'エラーが発生しました。');
        }
      }
    }
  };

  const getAuthUser = async () => {
    if (currentUser) {
      const uid = window.prompt('input uid');
      if (uid) {
        try {
          const func = firebase
            .app()
            .functions('asia-northeast1')
            .httpsCallable('getAuthUser');

          const result = await func({ uid });
          console.log({ result });
          alert('データを取得しました。');
        } catch (error) {
          console.log({ error });
          alert(error.message || 'エラーが発生しました。');
        }
      }
    }
  };

  const onChangeWordTarget = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as string;
    setWordTarget(value);
    const [modname, book] = value.split(':');

    const indexes = bookDictIndex(osisLocations, modname, book);
    const pageCount = Math.ceil(indexes.length / count_per_page);
    setPage({ current: 1, count: pageCount });

    setTargetOsisRefs(indexes.slice(0, count_per_page));
  };

  const onChangePage = (value: number) => {
    setPage({ ...page, current: value });

    const [modname, book] = wordTarget.split(':');

    const indexes = bookDictIndex(osisLocations, modname, book);
    const start = count_per_page * (page.current - 1);
    setTargetOsisRefs(indexes.slice(start, start + count_per_page));
  };

  const saveLayouts = async () => {
    const fname = window.prompt('レイアウトの名前をつけてください。')?.trim();
    if (fname) {
      saveSetting(targetHistory.history, layouts, fname);
      await updateSettingNames();
    }
  };

  return (
    <Navbar fixed className="bg-gray-100 flex justify-between h-12">
      <Flex align_items="center">
        <img
          src="j-sword.png"
          alt="logo"
          className="h-10 mx-2 my-1 hidden sm:block"
        />
        <Tooltip title="モジュールダウンロード" className="text-left">
          <Button
            variant="icon"
            size="sm"
            color="none"
            onClick={() => setOpener('installer')}
            className={clsx(
              'ml-1 my-2 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300',
              !emptyBibles && 'text-gray-500',
              emptyBibles && 'text-blue-400 animate-pulse'
            )}
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
                className={clsx(
                  'ml-1 mr-2 my-2 text-gray-500 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300',
                  !emptyLayout && 'text-gray-500',
                  !emptyBibles && emptyLayout && 'text-blue-400 animate-pulse'
                )}
              >
                <Icon name="view-grid-add" />
              </Button>
            }
          />
        </Tooltip>
        <Dropdown
          icon={
            <Button
              variant="icon"
              size="xs"
              color="none"
              disabled={!enablePrev}
              onClick={() => {
                if (targetHistory.moveHistory(-1)) {
                  updateTargetHistory(targetHistory.dup(), true);
                }
              }}
              className={clsx(
                'ml-1 my-2 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300',
                enablePrev && 'text-gray-500',
                !enablePrev && 'text-gray-300'
              )}
            >
              <Icon name="arrow-left" />
            </Button>
          }
          align="right"
          trigger="downup"
        >
          {targetHistory.prevHistory(10).map((target, index) => (
            <Dropdown.Item
              title={target.search}
              onClick={() => {
                if (targetHistory.moveHistory(-index - 1)) {
                  updateTargetHistory(targetHistory.dup(), true);
                }
              }}
            />
          ))}
        </Dropdown>
        <Dropdown
          icon={
            <Button
              variant="icon"
              size="xs"
              color="none"
              disabled={!enableNext}
              onClick={() => {
                if (targetHistory.moveHistory(1)) {
                  updateTargetHistory(targetHistory.dup(), true);
                }
              }}
              className={clsx(
                'ml-1 my-2 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300',
                enableNext && 'text-gray-500',
                !enableNext && 'text-gray-300'
              )}
            >
              <Icon name="arrow-right" />
            </Button>
          }
          align="left"
          trigger="downup"
        >
          {targetHistory.nextHistory(10).map((target, index) => (
            <Dropdown.Item
              title={target.search}
              onClick={() => {
                if (targetHistory.moveHistory(index + 1)) {
                  updateTargetHistory(targetHistory.dup(), true);
                }
              }}
            />
          ))}
        </Dropdown>
        <BookOpener className="mx-1" />
        {mode !== 'bible' && (
          <>
            <Form.Select
              value={wordTarget}
              options={osisOptions}
              onChange={onChangeWordTarget}
              size="sm"
              className="mx-3"
            />
            <Pagination
              size="sm"
              count={page.count}
              page={page.current}
              color="white"
              onChange={onChangePage}
            />
          </>
        )}
      </Flex>
      <Flex align_items="center">
        <Dropdown
          icon={
            <Button
              variant="icon"
              size="sm"
              color="none"
              className="m-2 text-gray-500 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300"
            >
              <Icon name="template" />
            </Button>
          }
          align="right"
        >
          {settingNames.map((name, index) => (
            <Dropdown.Item title={name} onClick={() => loadSetting(name)} />
          ))}
          <Dropdown.Divider />
          <Dropdown.Item title="レイアウトを保存" onClick={saveLayouts} />
        </Dropdown>
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
            <Dropdown.Item
              // title={`${interlocked ? '✓ ' : ''}聖書ビュー連動`}
              title={
                <Flex>
                  {interlocked && (
                    <Icon
                      name="check-circle"
                      variant="solid"
                      className="w-5 h-5 mr-1"
                    />
                  )}
                  聖書ビュー連動
                </Flex>
              }
              onClick={() => setInterlocked(!interlocked)}
            />
            {admin && (
              <Dropdown.Item
                title="ブックを追加"
                onClick={() => setOpener('book-form')}
              />
            )}
            {admin && (
              <Dropdown.Item title="ユーザ情報取得" onClick={getAuthUser} />
            )}
            {admin && (
              <Dropdown.Item
                title="マネージャに変更"
                onClick={setCustomUserClaims}
              />
            )}
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
      <BookForm
        open={opener === 'book-form'}
        docId={null}
        onClose={() => setOpener(null)}
      />
    </Navbar>
  );
};

export default AppBar;
