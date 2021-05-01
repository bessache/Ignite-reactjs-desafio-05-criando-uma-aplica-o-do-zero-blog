import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import Link from 'next/link';

import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { parsePtBrDate } from '../../utils/dateFormat';
import { Comments } from '../../components/Comments';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  nextPost: Post | null;
  prevPost: Post | null;
}

export default function Post({
  post,
  preview,
  prevPost,
  nextPost,
}: PostProps): JSX.Element {
  const Router = useRouter();
  if (Router.isFallback) {
    return (
      <>
        <Header />
        <div className={commonStyles.content}>Carregando...</div>
      </>
    );
  }

  const wordsperminutsreading = 200;
  const titleWords = post.data.title.split('').length;
  const totalWords = post.data.content.reduce((acc, content) => {
    const headingWords = content.heading
      ? content.heading.split(' ').length
      : 0;
    const bodyWords = RichText.asText(content.body).split(' ').length;

    // eslint-disable-next-line no-param-reassign
    acc += headingWords + bodyWords;
    return acc;
  }, 0);

  const readingTime = Math.ceil(
    (titleWords + totalWords) / wordsperminutsreading
  );

  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>
      <Header />
      <img src={post.data.banner.url} alt="banner" className={styles.banner} />
      <main className={commonStyles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div>
            <ul>
              <li>
                <FiCalendar size={20} />
                <time>
                  {format(
                    parseISO(post.first_publication_date),
                    'dd MMM yyyy',
                    { locale: ptBR }
                  )}
                </time>
              </li>
              <li>
                <FiUser size={20} />
                <span>{post.data.author}</span>
              </li>
            </ul>
            <span>
              <FiClock size={20} />
              {readingTime} min
            </span>
          </div>
          {post.first_publication_date !== post.last_publication_date && (
            <div className={styles.editedDatePost}>
              <p>
                *Editado em {parsePtBrDate(post.last_publication_date, false)}
              </p>
            </div>
          )}
          {post.data.content.map(content => (
            <div key={content.heading} className={styles.postContent}>
              <strong>{content.heading}</strong>
              <div
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
          <div className={styles.navigateTool}>
            {prevPost && (
              <Link href={`/post/${prevPost.uid}`}>
                <a className={styles.previous}>
                  {prevPost.data.title}
                  <span>Post anterior</span>
                </a>
              </Link>
            )}
            {nextPost && (
              <Link href={`/post/${nextPost.uid}`}>
                <a className={styles.next}>
                  {nextPost.data.title}
                  <span>Próximo post</span>
                </a>
              </Link>
            )}
          </div>
          {preview && (
            <aside className={commonStyles.exitPreview}>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </article>
        <div className={commonStyles.content} id="comments">
          <Comments />
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });
  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  if (!response) {
    return {
      notFound: true,
    };
  }

  const prevPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
      fetch: ['posts.title'],
    })
  ).results[0];
  const nextPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
      fetch: ['posts.title'],
    })
  ).results[0];

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,

    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
      preview,
      prevPost: prevPost ?? null,
      nextPost: nextPost ?? null,
    },
    revalidate: 60 * 60, // 1 hour,
  };
};
