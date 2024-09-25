import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Replace with your actual GraphQL endpoint
const httpLink = createHttpLink({
    uri: 'https://your-graphql-endpoint.com/graphql',
});

const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('apiToken'); // Or retrieve from environment/config
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        },
    };
});

const apolloClient = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
});

export default apolloClient;
