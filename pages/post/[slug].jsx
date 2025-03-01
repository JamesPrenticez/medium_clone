import prisma from '../../lib/prisma';
import Header from '../../components/Header'
import { convertFromRaw } from "draft-js";
import { stateToHTML } from 'draft-js-export-html';
import Footer from '../../components/Footer';
import { useForm } from "react-hook-form"
import { useState } from 'react';
import { useRouter } from 'next/router'

//https://www.npmjs.com/package/draft-js-export-html
//Methods - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_Objects#defining_methods

let options = {

  inlineStyles: {
    BOLD: {className: 'font-bold'},
    ITALIC: {className: 'italic'},
    UNDERLINE: {className: 'underline'},
    STRIKETHROUGH: {className: 'line-through'}
  },
  inlineStyleFn: (styles) => {
    let obj = {}
    obj.style = {}
    let color = styles.filter((value) => value.startsWith('color-')).first();
    let highlight = styles.filter((value) => value.startsWith('bgcolor-')).first();
    let fontFamily = styles.filter((value) => value.startsWith('fontfamily-')).first();
    let fontSize = styles.filter((value) => value.startsWith('fontsize-')).first();

    if (color) Object.assign(obj.style, {color: color.replace('color-', '')});
    if (highlight) Object.assign(obj.style, {backgroundColor: highlight.replace('bgcolor-', '')});
    if (fontFamily) Object.assign(obj.style, {fontFamily: fontFamily.replace('fontfamily-', '')});
    if (fontSize) Object.assign(obj.style, {fontSize: fontSize.replace('fontsize-', '')})
    return obj
  },
  blockRenderers: {
    code: (block) => {
        return '<pre>' + block.getText() + '</pre>';
    }
  },
}

function Post({post, comments}) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(false)

  const { 
    register,
    handleSubmit,
    formState:  {errors},
  } = useForm()

  // Submit Comments (not posts... perhaps componentize this?)
  const onSubmit = async(data) => {
    fetch('/api/post/createComment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then((res) => {
      //console.log(data)
      if(res.status === 200){
        setSubmitted(true)
        router.replace(router.asPath); //Troll solution to refresh props and fetch new comments
      } else setError(true)
    }).catch((err) => {
      //console.log(err)
    })
  }

  return (
    <>
      <Header />
      {/* Main Image */}
      <img 
        className="w-full h-60 object-cover"
        src={post.image}
        alt=''
      />
      <main className='min-h-screen max-w-7xl mx-auto px-5 pt-10'>
        {/* Blog Post Details */}
        <article className='max-w-3xl mx-auto p-5'>
          <h1 className='text-3xl mt-10 mb-3'>{post.title}</h1>
          <h2 className='text-xl font-light text-gray-500 mb-2'>{post.description}</h2>
          <div className='flex items-center space-x-2'>
            <img
              className='h-10 w-10 rounded-full object-cover' 
              src={post.author.image}
              alt=""
            />
            <p className='font-extralight text-sm'>
              Blog post by <span className='text-green-600'>{post.author.name}</span> - 
              Published at: {post.createdAt.toLocaleString()}</p>
          </div>

          {/* Blog Post Content */}
          <div>
            <section
                  className="my-6"
                  dangerouslySetInnerHTML={{ __html: stateToHTML(convertFromRaw(JSON.parse(post.content)), options) }}
            />
          </div>
        </article>

        {/* Leave a Comment */}
        <div className='max-w-3xl mx-auto my-5 h-[3px] bg-gradient-to-r from-white via-yellow-500 to-white'></div>

        
        {submitted ? (
          //https://codepen.io/ottodevs/pen/BMmdMM
          //https://dev.to/devwares/how-to-create-tailwind-css-animation-379
          <div className='flex flex-col p-10 my-10 bg-yellow-500 text-white max-w-3xl mx-auto'>
            <h3 className='text-3xl font-bold'>Thank you for submitting your comment!</h3>
            <p className='text-xl'>Once it has been approved, it will appear below!</p>
            <p className='text-fuchsia-500 text-md'>Jokes! Moderators on holiday - all comments are automatically approved</p>
          </div>
        ):(
          <form 
            onSubmit={handleSubmit(onSubmit)}
            className='flex flex-col p-5 max-w-3xl mx-auto mb-10 shadow-md'
          >
            <h3 className='text-sm text-yellow-500'>Enjoyed this article?</h3>
            <h2 className='text-3xl'>Leave a comment below!</h2>
            <hr className='py-3 mt-2'/>

            <input 
              {...register("postId")}
              type="hidden"
              name="postId"
              value={post.id}
            />

            <label className='block mb-5'>
              <span className='text-gray-700'>Name</span>
              {errors.name && (
                <span className='text-red-500 italic text-sm'>{" "}
                - required
              </span>
              )}
              <input
                {...register("name", { required: true })}
                className='shadow rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 outline-none focus:ring-2'
                placeholder="John Appleseed"
                type="text"
              />
            </label>
            <label className='block mb-5'>
              <span className='text-gray-700'>Email</span>{" "}
              {errors.email && (
                <span className='text-red-500 italic text-sm'>
                  - required
                </span>
              )}
              <input
                {...register("email", { required: true })} 
                className='shadow rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 outline-none focus:ring-2'
                placeholder="JohnAppleseed@xtra.co.nz"
                type="email"
              />
            </label>
            <label className='block mb-5'>
              <span className='text-gray-700'> Comment</span>{" "}
              {errors.content && (
                <span className='text-red-500 italic text-sm'>
                  - required
                </span>
              )}
              <textarea 
                {...register("content", { required: true })}
                className='shadow border rounded py-2 px-3 form-text-area mt-1 block w-full ring-yellow-500 outline-none focus:ring-2'
                placeholder="John Appleseed"
                rows={4}
              />
            </label>

            <input type="submit" className='shadow bg-yellow-500 hover:bg-yellow-400 focus:shadow-outline focus:outline-none text-white px-4 py-2 rounded cursor-pointer' />
            {error ? <p className='flex justify-center text-red-500'>Error! Please let admin know</p> : ''}
          </form>
        )}

        {/* Render Comments */}
        <div className='flex flex-col p-4 my-10 max-w-3xl mx-auto shadow-md shadow-yellow-500 space-y-2'>
          <h2 className='text-3xl'>Comments</h2>
          <hr className='pb-2' />
          {comments.length > 0  ? '' : <h2 className='text-gray-300'>😢 There are no comments yet... you can be the first!</h2>}

          {comments.map((comment) => {
            return(
              <div key={comment.id}>
                <p>
                  <span className='text-yellow-500 font-semibold'>{comment.name}: </span>
                  <span className=''>{comment.content}</span>
                </p> 
                  <span className='text-xs text-gray-300'>{comment.createdAt.toLocaleString()}</span>
              </div>
            )
          })}
          
        </div>
              
      </main>
      <Footer />
    </>
  )
}

export default Post

export const getStaticPaths = async () => {
  const query = await prisma.post.findMany({
    select:{
      slug: true
    }
  })
  //console.log(query)
  
  const paths = query.map(post => ({
    params: {
      slug: post.slug
    }
  }))
  //console.log(paths)

  return {
    paths,
    fallback: 'blocking'
  }
}

export const getStaticProps = async ({params}) => {
    const post = await prisma.post.findUnique({
    where: {
      slug: params?.slug
    },
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      image: true,
      createdAt: true,
      author: {
        select: {
            name: true,
            image: true,
          },
      }
    },
  })

  if(!post){
    return { notFound: true }
  }

  const comments = await prisma.comment.findMany({
    where: {
      postId: post.id,
      approved: true
    },
    select: {
      id: true,
      name: true,
      content: true,
      createdAt: true,
    }
  })

  return {
    props: { post, comments },
    revalidate: 60, // after 60 seconds it will update the old cache
  }
}