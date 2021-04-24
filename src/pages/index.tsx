import { GetStaticProps } from 'next';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';

import Head from 'next/head';
import Prismic from '@prismicio/client';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';

import styles from './home.module.scss';
import { dateFormat } from '../utils/dateFormat';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const formattedPost = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: dateFormat(new Date(post.first_publication_date)),
    };
  });

  const [posts, setPosts] = useState<Post[]>(formattedPost);

  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handlePostsPagination(): Promise<void> {
    if (nextPage === null) return;

    const postsResults = await fetch(nextPage).then(response =>
      response.json()
    );

    const newPosts = postsResults.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: dateFormat(
          new Date(post.first_publication_date)
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts([...posts, ...newPosts]);
    setNextPage(postsResults.next_page);
  }

  return (
    <>
      <Head>
        <title>Home | SpaceTravelling</title>
      </Head>
      <main className={commonStyles.container}>
        <Header />
        <div className={styles.postsList}>
          {postsPagination.results.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a className={styles.postContent}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.postInfoContent}>
                  <time>
                    <FiCalendar />
                    {post.first_publication_date}
                  </time>
                  <span>
                    <FiUser />
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}

          {nextPage && (
            <button type="button" onClick={handlePostsPagination}>
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 1,
    }
  );

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results,
  };

  return {
    props: {
      postsPagination,
    },
    revalidate: 60 * 60,
  };
};
